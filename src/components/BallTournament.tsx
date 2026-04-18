import Matter from "matter-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Country } from "../data/countries";
import { playClick, playWhistle } from "../utils/sounds";

interface BallTournamentProps {
	teams: Country[];
	size: 32 | 48;
	onChampion: (champion: Country, runnerUp: Country) => void;
}

interface BallMeta {
	team: Country;
	body: Matter.Body;
	texture: HTMLCanvasElement;
	radius: number;
	eliminated?: boolean;
}

const DRAIN_COOLDOWN_MS = 80;
const BASE_BALL_RADIUS = 22;
const MIN_BALL_RADIUS = 14;
// funnel geometry — kept in sync across physics walls, shake region, drain
// detection, and render. gap is wide enough that the largest ball passes
// through with comfortable margin (~1.6× diameter) even on mobile.
const computeFunnelGap = (w: number) => Math.max(72, Math.min(104, w * 0.14));
const FUNNEL_TOP_RATIO = 0.42;

function buildRoundSequence(size: 32 | 48): number[] {
	if (size === 48) return [48, 32, 16, 8, 4, 2, 1];
	return [32, 16, 8, 4, 2, 1];
}

function buildBallTexture(team: Country, radius: number, dpr: number) {
	const px = Math.ceil(radius * 2 * dpr);
	const canvas = document.createElement("canvas");
	canvas.width = px;
	canvas.height = px;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;
	ctx.scale(dpr, dpr);
	const r = radius;
	const grad = ctx.createRadialGradient(r * 0.7, r * 0.6, r * 0.2, r, r, r);
	grad.addColorStop(0, "#ffffff");
	grad.addColorStop(0.6, "#f5f5f5");
	grad.addColorStop(1, "#c9cfd4");
	ctx.beginPath();
	ctx.arc(r, r, r - 1, 0, Math.PI * 2);
	ctx.fillStyle = grad;
	ctx.fill();
	ctx.lineWidth = 1.5;
	ctx.strokeStyle = "rgba(0,0,0,0.15)";
	ctx.stroke();
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	ctx.font = `${Math.round(r * 1.1)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",system-ui,sans-serif`;
	ctx.fillText(team.flag, r, r - r * 0.15);
	ctx.font = `700 ${Math.round(r * 0.52)}px system-ui,-apple-system,sans-serif`;
	ctx.fillStyle = "#2c3e50";
	ctx.fillText(team.code, r, r + r * 0.52);
	return canvas;
}

export function BallTournament({
	teams,
	size,
	onChampion,
}: BallTournamentProps) {
	const hostRef = useRef<HTMLDivElement | null>(null);
	const canvasRef = useRef<HTMLCanvasElement | null>(null);
	const engineRef = useRef<Matter.Engine | null>(null);
	const ballsRef = useRef<Map<number, BallMeta>>(new Map());
	const wallsRef = useRef<Matter.Body[]>([]);
	const rafRef = useRef<number | null>(null);
	const drainedIdsRef = useRef<Set<number>>(new Set());
	const lastDrainAtRef = useRef<number>(0);
	const roundEndedRef = useRef<boolean>(false);
	const finalDoneRef = useRef<boolean>(false);

	const rounds = useMemo(() => buildRoundSequence(size), [size]);
	const [roundIdx, setRoundIdx] = useState(0);
	const [survivorsByRound, setSurvivorsByRound] = useState<Country[]>(teams);
	const [exitedThisRound, setExitedThisRound] = useState<Country[]>([]);
	const [eliminatedThisRound, setEliminatedThisRound] = useState<Country[]>([]);
	const [roundActive, setRoundActive] = useState(false);
	const [roundEnded, setRoundEnded] = useState(false);

	const currentCount = rounds[roundIdx];
	const nextCount = rounds[roundIdx + 1] ?? 1;
	const isFinalRound = nextCount === 1;
	const targetExits = isFinalRound ? 1 : nextCount;

	const computeRadius = useCallback(
		(w: number, h: number) => {
			const count = Math.max(1, survivorsByRound.length);
			const target = (w * h * 0.18) / count;
			const r = Math.sqrt(target / Math.PI);
			return Math.max(MIN_BALL_RADIUS, Math.min(BASE_BALL_RADIUS, r));
		},
		[survivorsByRound.length],
	);

	const rebuildWalls = useCallback((w: number, h: number) => {
		const engine = engineRef.current;
		if (!engine) return;
		for (const wall of wallsRef.current) {
			Matter.World.remove(engine.world, wall);
		}
		wallsRef.current = [];

		const thick = 60;
		const gapWidth = computeFunnelGap(w);
		const floorY = h - 1;
		const funnelTopY = h * FUNNEL_TOP_RATIO;
		const funnelBottomY = h - 8;
		const cx = w / 2;

		const common: Matter.IChamferableBodyDefinition = {
			isStatic: true,
			restitution: 0.35,
			friction: 0.002,
			frictionStatic: 0.002,
			render: { visible: false },
		};

		const left = Matter.Bodies.rectangle(
			-thick / 2,
			h / 2,
			thick,
			h * 3,
			common,
		);
		const right = Matter.Bodies.rectangle(
			w + thick / 2,
			h / 2,
			thick,
			h * 3,
			common,
		);
		const funnelLen = Math.hypot(cx - gapWidth / 2, funnelBottomY - funnelTopY);
		const angleL = Math.atan2(
			funnelBottomY - funnelTopY,
			cx - gapWidth / 2 - 0,
		);
		const funnelL = Matter.Bodies.rectangle(
			(0 + cx - gapWidth / 2) / 2,
			(funnelTopY + funnelBottomY) / 2,
			funnelLen,
			14,
			{ ...common, angle: angleL },
		);
		const angleR = -angleL;
		const funnelR = Matter.Bodies.rectangle(
			(w + cx + gapWidth / 2) / 2,
			(funnelTopY + funnelBottomY) / 2,
			funnelLen,
			14,
			{ ...common, angle: angleR },
		);
		const floorLeftW = cx - gapWidth / 2;
		const floorRightW = w - (cx + gapWidth / 2);
		const floorL = Matter.Bodies.rectangle(
			floorLeftW / 2,
			floorY + thick / 2,
			floorLeftW,
			thick,
			common,
		);
		const floorR = Matter.Bodies.rectangle(
			cx + gapWidth / 2 + floorRightW / 2,
			floorY + thick / 2,
			floorRightW,
			thick,
			common,
		);

		wallsRef.current = [left, right, funnelL, funnelR, floorL, floorR];
		Matter.World.add(engine.world, wallsRef.current);
	}, []);

	useEffect(() => {
		const host = hostRef.current;
		const canvas = canvasRef.current;
		if (!host || !canvas) return;

		const engine = Matter.Engine.create({
			gravity: { x: 0, y: 1.4 },
			enableSleeping: false,
		});
		engine.positionIterations = 6;
		engine.velocityIterations = 4;
		engineRef.current = engine;

		const ctx = canvas.getContext("2d");
		const dpr = Math.min(2, window.devicePixelRatio || 1);

		let widthCss = host.clientWidth;
		let heightCss = host.clientHeight;

		const applySize = () => {
			widthCss = host.clientWidth;
			heightCss = host.clientHeight;
			canvas.width = Math.round(widthCss * dpr);
			canvas.height = Math.round(heightCss * dpr);
			canvas.style.width = `${widthCss}px`;
			canvas.style.height = `${heightCss}px`;
			rebuildWalls(widthCss, heightCss);
		};
		applySize();

		canvas.style.touchAction = "none";

		// drag a ball to fling it (works on mouse + touch)
		const mouse = Matter.Mouse.create(canvas);
		const mc = Matter.MouseConstraint.create(engine, {
			mouse,
			constraint: {
				stiffness: 0.14,
				damping: 0.08,
				render: { visible: false },
			},
		});
		Matter.World.add(engine.world, mc);

		let lastShakeAt = performance.now();
		const onAfterUpdate = () => {
			const now = performance.now();
			const cx = widthCss / 2;
			const gap = computeFunnelGap(widthCss);
			const leftEdge = cx - gap / 2;
			const rightEdge = cx + gap / 2;
			const threshold = heightCss + 40;
			const funnelTopY = heightCss * FUNNEL_TOP_RATIO;

			const stallMs =
				ballsRef.current.size > 0 && !roundEndedRef.current
					? now - lastDrainAtRef.current
					: 0;

			// stage 1 (~500ms stall): gentle random shake to break contacts
			if (stallMs > 500 && now - lastShakeAt > 350) {
				lastShakeAt = now;
				for (const meta of ballsRef.current.values()) {
					if (meta.eliminated) continue;
					Matter.Body.applyForce(meta.body, meta.body.position, {
						x: (Math.random() - 0.5) * 0.05 * meta.body.mass,
						y: -0.022 * meta.body.mass,
					});
					Matter.Body.setAngularVelocity(
						meta.body,
						(Math.random() - 0.5) * 0.3,
					);
				}
			}

			// stage 2 (~1500ms stall): actively pull funnel-region balls toward
			// the gap so wedged piles get un-stuck even on narrow mobile screens
			if (stallMs > 1500) {
				for (const meta of ballsRef.current.values()) {
					if (meta.eliminated) continue;
					const body = meta.body;
					if (body.position.y < funnelTopY) continue;
					const dx = cx - body.position.x;
					const absDx = Math.abs(dx);
					Matter.Body.applyForce(body, body.position, {
						x: absDx > 2 ? Math.sign(dx) * 0.003 * body.mass : 0,
						y: 0.008 * body.mass,
					});
				}
			}

			for (const [id, meta] of ballsRef.current) {
				if (drainedIdsRef.current.has(id)) continue;
				if (meta.eliminated) continue;
				const body = meta.body;
				// drain zone is the bottom gap; widened y-tolerance so balls don't
				// skim past on a fast frame
				if (
					body.position.y > heightCss - 12 &&
					body.position.x > leftEdge &&
					body.position.x < rightEdge
				) {
					if (now - lastDrainAtRef.current > DRAIN_COOLDOWN_MS) {
						lastDrainAtRef.current = now;
						drainedIdsRef.current.add(id);
						const team = meta.team;
						setExitedThisRound((prev) => [...prev, team]);
						playWhistle();
						setTimeout(() => {
							Matter.World.remove(engine.world, body);
							ballsRef.current.delete(id);
						}, 180);
					}
				} else if (body.position.y > threshold) {
					drainedIdsRef.current.add(id);
					setExitedThisRound((prev) => [...prev, meta.team]);
					Matter.World.remove(engine.world, body);
					ballsRef.current.delete(id);
				}
			}
		};
		Matter.Events.on(engine, "afterUpdate", onAfterUpdate);

		let lastTime = performance.now();
		const render = () => {
			if (!ctx) return;
			const now = performance.now();
			const delta = Math.min(16.67, now - lastTime);
			lastTime = now;
			Matter.Engine.update(engine, delta);
			ctx.save();
			ctx.scale(dpr, dpr);
			ctx.clearRect(0, 0, widthCss, heightCss);

			const bg = ctx.createLinearGradient(0, 0, 0, heightCss);
			bg.addColorStop(0, "rgba(41, 128, 185, 0.08)");
			bg.addColorStop(1, "rgba(41, 128, 185, 0.02)");
			ctx.fillStyle = bg;
			ctx.fillRect(0, 0, widthCss, heightCss);

			const cxp = widthCss / 2;
			const gap = computeFunnelGap(widthCss);
			const topY = heightCss * FUNNEL_TOP_RATIO;
			const botY = heightCss - 8;

			// filled triangles below funnel arms — shows the slope as a solid chute
			const slopeFill = ctx.createLinearGradient(0, topY, 0, botY);
			slopeFill.addColorStop(0, "rgba(44, 62, 80, 0.18)");
			slopeFill.addColorStop(1, "rgba(44, 62, 80, 0.42)");
			ctx.fillStyle = slopeFill;
			ctx.beginPath();
			ctx.moveTo(0, topY);
			ctx.lineTo(cxp - gap / 2, botY);
			ctx.lineTo(0, botY);
			ctx.closePath();
			ctx.fill();
			ctx.beginPath();
			ctx.moveTo(widthCss, topY);
			ctx.lineTo(cxp + gap / 2, botY);
			ctx.lineTo(widthCss, botY);
			ctx.closePath();
			ctx.fill();

			// stroke the slope edges (the physics walls) as visible bars
			ctx.strokeStyle = "rgba(44, 62, 80, 0.85)";
			ctx.lineWidth = 4;
			ctx.lineCap = "round";
			ctx.beginPath();
			ctx.moveTo(0, topY);
			ctx.lineTo(cxp - gap / 2, botY);
			ctx.moveTo(widthCss, topY);
			ctx.lineTo(cxp + gap / 2, botY);
			ctx.stroke();

			for (const [, meta] of ballsRef.current) {
				const body = meta.body;
				const r = meta.radius;
				ctx.save();
				ctx.translate(body.position.x, body.position.y);
				ctx.rotate(body.angle);
				ctx.globalAlpha = meta.eliminated ? 0.35 : 1;
				ctx.drawImage(meta.texture, -r, -r, r * 2, r * 2);
				ctx.restore();
			}

			ctx.restore();
			rafRef.current = requestAnimationFrame(render);
		};
		rafRef.current = requestAnimationFrame(render);

		const ro = new ResizeObserver(() => applySize());
		ro.observe(host);

		return () => {
			ro.disconnect();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			Matter.Events.off(engine, "afterUpdate", onAfterUpdate);
			Matter.World.clear(engine.world, false);
			Matter.Engine.clear(engine);
			ballsRef.current.clear();
			wallsRef.current = [];
		};
	}, [rebuildWalls]);

	const clearStageBalls = useCallback(() => {
		const engine = engineRef.current;
		if (!engine) return;
		for (const [, meta] of ballsRef.current) {
			Matter.World.remove(engine.world, meta.body);
		}
		ballsRef.current.clear();
		drainedIdsRef.current.clear();
		lastDrainAtRef.current = 0;
	}, []);

	const spawnRound = useCallback(() => {
		const engine = engineRef.current;
		const host = hostRef.current;
		if (!engine || !host) return;

		clearStageBalls();
		roundEndedRef.current = false;
		setRoundEnded(false);
		setExitedThisRound([]);
		setEliminatedThisRound([]);
		setRoundActive(true);
		playClick();

		const w = host.clientWidth;
		const h = host.clientHeight;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		const radius = computeRadius(w, h);
		const roster = survivorsByRound;

		roster.forEach((team, i) => {
			setTimeout(() => {
				if (!engineRef.current) return;
				const ball = Matter.Bodies.circle(
					40 + Math.random() * (w - 80),
					-radius - 20 - Math.random() * 200,
					radius,
					{
						restitution: 0.72,
						friction: 0.02,
						frictionAir: 0.002,
						density: 0.0012,
						slop: 0.02,
					},
				);
				Matter.Body.setVelocity(ball, {
					x: (Math.random() - 0.5) * 4,
					y: 1 + Math.random() * 2,
				});
				Matter.Body.setAngularVelocity(ball, (Math.random() - 0.5) * 0.2);
				Matter.World.add(engineRef.current.world, ball);
				ballsRef.current.set(ball.id, {
					team,
					body: ball,
					texture: buildBallTexture(team, radius, dpr),
					radius,
				});
			}, i * 70);
		});
	}, [clearStageBalls, computeRadius, survivorsByRound]);

	// detect round end (targetExits reached)
	useEffect(() => {
		if (!roundActive || roundEndedRef.current) return;
		if (exitedThisRound.length < targetExits) return;

		roundEndedRef.current = true;

		if (isFinalRound) {
			if (finalDoneRef.current) return;
			finalDoneRef.current = true;
			const champion = exitedThisRound[0];
			// runnerUp = the ball still on stage (not yet drained)
			let runnerUp: Country | undefined;
			for (const meta of ballsRef.current.values()) {
				if (!drainedIdsRef.current.has(meta.body.id)) {
					runnerUp = meta.team;
					break;
				}
			}
			if (!runnerUp) {
				runnerUp = survivorsByRound.find((t) => t.code !== champion.code);
			}
			const fallback = runnerUp ?? survivorsByRound[1] ?? survivorsByRound[0];
			setTimeout(() => {
				onChampion(champion, fallback);
			}, 800);
			return;
		}

		// non-final: remaining balls become eliminated (fade out)
		const engine = engineRef.current;
		const eliminated: Country[] = [];
		for (const [id, meta] of ballsRef.current) {
			if (drainedIdsRef.current.has(id)) continue;
			meta.eliminated = true;
			eliminated.push(meta.team);
		}
		setEliminatedThisRound(eliminated);
		setRoundEnded(true);
		setRoundActive(false);

		// fade bodies out then remove
		setTimeout(() => {
			if (!engine) return;
			for (const [id, meta] of ballsRef.current) {
				if (meta.eliminated) {
					Matter.World.remove(engine.world, meta.body);
					ballsRef.current.delete(id);
				}
			}
		}, 600);
	}, [
		exitedThisRound,
		isFinalRound,
		onChampion,
		roundActive,
		survivorsByRound,
		targetExits,
	]);

	const startRound = useCallback(() => {
		spawnRound();
	}, [spawnRound]);

	const goNextRound = useCallback(() => {
		const advancers = exitedThisRound.slice(0, nextCount);
		setSurvivorsByRound(advancers);
		setRoundIdx((i) => i + 1);
		setRoundEnded(false);
		setRoundActive(false);
		setExitedThisRound([]);
		setEliminatedThisRound([]);
		roundEndedRef.current = false;
	}, [exitedThisRound, nextCount]);

	// when survivorsByRound updates after advancing, auto-spawn next round
	const prevRoundIdxRef = useRef(roundIdx);
	useEffect(() => {
		if (prevRoundIdxRef.current === roundIdx) return;
		prevRoundIdxRef.current = roundIdx;
		// spawn after a tick so state settles
		const t = setTimeout(() => {
			spawnRound();
		}, 250);
		return () => clearTimeout(t);
	}, [roundIdx, spawnRound]);

	// count-up: how many teams have already advanced this round
	const advancedCount = Math.min(exitedThisRound.length, targetExits);
	const showStartOverlay = !roundActive && !roundEnded && roundIdx === 0;
	const showNextButton = roundEnded && !isFinalRound;

	// label helper: "결승" for 2-ball round, "{n}강" otherwise
	const roundLabel = (count: number) => (count === 2 ? "결승" : `${count}강`);

	// list of teams that have advanced this round (in exit order)
	const advancers = useMemo(
		() => exitedThisRound.slice(0, targetExits),
		[exitedThisRound, targetExits],
	);

	return (
		<div className="ball-tour">
			<div className="ball-tour-header">
				<div className="ball-tour-round-title">{roundLabel(currentCount)}</div>
				<div className="ball-tour-round-progress">
					진출 {advancedCount} / {targetExits}
				</div>
			</div>

			<div className="ball-tour-main">
				<div className="ball-tour-stage" ref={hostRef}>
					<canvas ref={canvasRef} className="ball-tour-canvas" />
					{showStartOverlay && (
						<div className="ball-tour-overlay">
							<p className="ball-tour-hint">
								드래그해서 공을 휘저을 수 있습니다
							</p>
						</div>
					)}
				</div>

				<aside className="ball-tour-sidebar">
					<section className="ball-tour-survivors">
						<h3>진출</h3>
						<ol>
							{advancers.map((t, i) => (
								<li key={t.code} className="ball-tour-team-row">
									<span className="ball-tour-seed">{i + 1}</span>
									<span className="ball-tour-flag">{t.flag}</span>
									<span className="ball-tour-name">{t.nameKo}</span>
								</li>
							))}
						</ol>
					</section>
					<section className="ball-tour-eliminated">
						<h3>탈락 (이번 라운드)</h3>
						<ol>
							{eliminatedThisRound.map((t) => (
								<li key={t.code} className="ball-tour-team-row eliminated">
									<span className="ball-tour-flag">{t.flag}</span>
									<span className="ball-tour-name">{t.nameKo}</span>
								</li>
							))}
						</ol>
					</section>
				</aside>
			</div>

			<div className="ball-tour-actions">
				{showStartOverlay && (
					<button
						type="button"
						className="btn btn-round-start"
						onClick={startRound}
					>
						{roundLabel(currentCount)} 시작
					</button>
				)}
				{showNextButton && (
					<button
						type="button"
						className="btn btn-round-next"
						onClick={goNextRound}
					>
						{roundLabel(nextCount)} 진행
					</button>
				)}
			</div>
		</div>
	);
}
