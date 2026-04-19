import * as planck from "planck";
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
	body: planck.Body;
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

// Planck uses meters, the canvas uses pixels. 30 px per meter keeps body
// sizes inside Box2D's well-tuned 0.1-10m range (a 22px ball is 0.73m).
const SCALE = 30;
const pxToM = (p: number) => p / SCALE;
const mToPx = (m: number) => m * SCALE;

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
	const worldRef = useRef<planck.World | null>(null);
	const ballsRef = useRef<Map<planck.Body, BallMeta>>(new Map());
	const wallsRef = useRef<planck.Body[]>([]);
	type PegMeta =
		| { kind: "peg"; body: planck.Body; x: number; y: number; r: number }
		| {
				kind: "bar";
				body: planck.Body;
				x: number;
				y: number;
				length: number;
				angle: number;
		  }
		| {
				kind: "tri";
				body: planck.Body;
				x: number;
				y: number;
				size: number;
				angle: number;
		  };
	const pegsRef = useRef<PegMeta[]>([]);
	const groundBodyRef = useRef<planck.Body | null>(null);
	const mouseJointRef = useRef<planck.MouseJoint | null>(null);
	const rafRef = useRef<number | null>(null);
	const drainedBodiesRef = useRef<Set<planck.Body>>(new Set());
	const lastDrainAtRef = useRef<number>(0);
	const roundEndedRef = useRef<boolean>(false);
	const finalDoneRef = useRef<boolean>(false);
	// set by spawnRound to flush the physics-clock after the spawn's
	// synchronous work (texture gen + body creation) so the first rendered
	// frame after spawn doesn't roll physics forward by the spawn duration.
	const resetClockRef = useRef<boolean>(false);

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
		const world = worldRef.current;
		if (!world) return;
		for (const wall of wallsRef.current) {
			world.destroyBody(wall);
		}
		wallsRef.current = [];

		const thick = 60;
		const gapWidth = computeFunnelGap(w);
		const floorY = h - 1;
		const funnelTopY = h * FUNNEL_TOP_RATIO;
		const funnelBottomY = h - 8;
		const cx = w / 2;

		// helper: create a static box body (takes pixel coords, converts to m).
		const addBox = (
			cxPx: number,
			cyPx: number,
			wPx: number,
			hPx: number,
			angle = 0,
		) => {
			const body = world.createBody({
				type: "static",
				position: planck.Vec2(pxToM(cxPx), pxToM(cyPx)),
				angle,
			});
			body.createFixture({
				shape: planck.Box(pxToM(wPx / 2), pxToM(hPx / 2)),
				friction: 0.005,
				restitution: 0.45,
			});
			return body;
		};

		const left = addBox(-thick / 2, h / 2, thick, h * 3);
		const right = addBox(w + thick / 2, h / 2, thick, h * 3);

		const funnelLen = Math.hypot(cx - gapWidth / 2, funnelBottomY - funnelTopY);
		const angleL = Math.atan2(funnelBottomY - funnelTopY, cx - gapWidth / 2);
		const funnelL = addBox(
			(0 + cx - gapWidth / 2) / 2,
			(funnelTopY + funnelBottomY) / 2,
			funnelLen,
			24,
			angleL,
		);
		const angleR = -angleL;
		const funnelR = addBox(
			(w + cx + gapWidth / 2) / 2,
			(funnelTopY + funnelBottomY) / 2,
			funnelLen,
			24,
			angleR,
		);

		const floorLeftW = cx - gapWidth / 2;
		const floorRightW = w - (cx + gapWidth / 2);
		const floorL = addBox(
			floorLeftW / 2,
			floorY + thick / 2,
			floorLeftW,
			thick,
		);
		const floorR = addBox(
			cx + gapWidth / 2 + floorRightW / 2,
			floorY + thick / 2,
			floorRightW,
			thick,
		);

		wallsRef.current = [left, right, funnelL, funnelR, floorL, floorR];
	}, []);

	// randomize the peg layout. called on every resize (via rebuildWalls's
	// downstream effect) AND on every new round spawn so each round feels
	// different. pegs cover the full vertical drop zone — above the funnel,
	// and inside the funnel (x-clamped to the live chute width at each y) —
	// with the very bottom left clear so they don't jam the drain.
	const rebuildPegs = useCallback((w: number, h: number) => {
		const world = worldRef.current;
		if (!world) return;
		for (const peg of pegsRef.current) {
			world.destroyBody(peg.body);
		}
		pegsRef.current = [];

		const funnelTopY = h * FUNNEL_TOP_RATIO;
		const cx = w / 2;

		const zoneTop = 80;
		// keep pegs clear of the funnel slopes — only above the chute entrance.
		const zoneBottom = funnelTopY - 16;
		const zoneH = Math.max(0, zoneBottom - zoneTop);
		if (zoneH <= 0) return;

		// density + radius jitter: 4-7 px pegs (smaller so balls squeeze by).
		const randRadius = () => 4 + Math.random() * 3;
		// obstacle mix: small chance of a thin rotated bar or a triangle peg
		// instead of a plain circle — adds visual and bounce-direction variety.
		const BAR_CHANCE = 0.12;
		const TRI_CHANCE = 0.18;

		// require that any two pegs leave ≥ (ball diameter + margin) between
		// their surfaces — otherwise a ball could wedge.
		const BALL_GAP_MARGIN = 16;
		const ballDiameter = BASE_BALL_RADIUS * 2;
		const placed: Array<{ x: number; y: number; r: number }> = [];

		// helper: place a spinning triangle peg at (x,y). used for the fixed
		// center-bottom pyramid. kinematic with a slow random angular velocity
		// so even the pyramid triangles rotate.
		const addPyramidTriangle = (x: number, y: number, size: number) => {
			const s = Math.sqrt(3) / 2;
			const verts = [
				planck.Vec2(0, -pxToM(size)),
				planck.Vec2(pxToM(size * s), pxToM(size / 2)),
				planck.Vec2(-pxToM(size * s), pxToM(size / 2)),
			];
			const body = world.createBody({
				type: "kinematic",
				position: planck.Vec2(pxToM(x), pxToM(y)),
				angle: Math.random() * Math.PI * 2,
				angularVelocity:
					(Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 1.2),
			});
			body.createFixture({
				shape: planck.Polygon(verts),
				friction: 0.02,
				restitution: 0.82,
			});
			pegsRef.current.push({
				kind: "tri",
				body,
				x,
				y,
				size,
				angle: 0,
			});
		};

		// --- fixed center-bottom pyramid: 2 spinning triangles on top, one
		// spinning bar across the bottom. both rows sit inside the chute so
		// balls funneling down always have to deal with them.
		const pyramidSize = 26;
		const pyramidColGap = 140;
		const pyramidRowGap = 110;
		const funnelBottomY = h - 8;
		// bottom bar sits ~90px above the drain so it doesn't jam the exit.
		const pyramidBottomY = funnelBottomY - 90;
		const pyramidTopY = pyramidBottomY - pyramidRowGap;
		const pyramidPositions: Array<{ x: number; y: number }> = [];

		// top row: 2 spinning triangles, centered around cx.
		if (pyramidTopY >= zoneTop) {
			const startX = cx - pyramidColGap / 2;
			for (let i = 0; i < 2; i += 1) {
				const x = startX + i * pyramidColGap;
				addPyramidTriangle(x, pyramidTopY, pyramidSize);
				pyramidPositions.push({ x, y: pyramidTopY });
				placed.push({ x, y: pyramidTopY, r: pyramidSize });
			}
		}

		// bottom row: one thick spinning bar — wider reach than a single
		// triangle so balls always have to bounce off it on the way out.
		if (pyramidBottomY >= zoneTop) {
			const barLen = 72;
			const barThick = 8;
			const bottomBar = world.createBody({
				type: "kinematic",
				position: planck.Vec2(pxToM(cx), pxToM(pyramidBottomY)),
				angle: 0,
				angularVelocity:
					(Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.0),
			});
			bottomBar.createFixture({
				shape: planck.Box(pxToM(barLen / 2), pxToM(barThick / 2)),
				friction: 0.02,
				restitution: 0.82,
			});
			pegsRef.current.push({
				kind: "bar",
				body: bottomBar,
				x: cx,
				y: pyramidBottomY,
				length: barLen,
				angle: 0,
			});
			pyramidPositions.push({ x: cx, y: pyramidBottomY });
			placed.push({ x: cx, y: pyramidBottomY, r: barLen / 2 });
		}

		// sparse layout: bars/triangles are much bigger than plain pegs so we
		// reserve more area per obstacle and use a conservative effective radius
		// when checking separation (doesn't know yet which kind this slot will
		// become, so budget for the worst case).
		const targetCount = Math.max(5, Math.floor((w * zoneH) / 18000));
		const EFFECTIVE_PLACEMENT_R = 32;

		let attempts = 0;
		while (placed.length < targetCount && attempts < targetCount * 40) {
			attempts += 1;
			const py = zoneTop + Math.random() * zoneH;
			const px = 40 + Math.random() * (w - 80);
			const r = randRadius();
			let tooClose = false;
			for (const p of placed) {
				const effR = Math.max(r, EFFECTIVE_PLACEMENT_R);
				const effP = Math.max(p.r, EFFECTIVE_PLACEMENT_R);
				const minDist = ballDiameter + BALL_GAP_MARGIN + effR + effP;
				if (Math.hypot(p.x - px, p.y - py) < minDist) {
					tooClose = true;
					break;
				}
			}
			if (tooClose) continue;
			placed.push({ x: px, y: py, r });
		}

		// skip random creation for the pyramid positions — they were already
		// created above and only live in `placed` as reservations.
		const pyramidKey = new Set(
			pyramidPositions.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`),
		);

		for (const p of placed) {
			if (pyramidKey.has(`${p.x.toFixed(2)},${p.y.toFixed(2)}`)) continue;
			const roll = Math.random();
			if (roll < BAR_CHANCE) {
				// chunky bouncy bar, spinning slowly — random tilt + angular
				// velocity so balls get a time-varying deflection.
				const angle = (Math.random() - 0.5) * (Math.PI / 2);
				const barLen = 46 + Math.random() * 28;
				const barThick = 8;
				const body = world.createBody({
					type: "kinematic",
					position: planck.Vec2(pxToM(p.x), pxToM(p.y)),
					angle,
					angularVelocity:
						(Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 1.2),
				});
				body.createFixture({
					shape: planck.Box(pxToM(barLen / 2), pxToM(barThick / 2)),
					friction: 0.02,
					restitution: 0.8,
				});
				pegsRef.current.push({
					kind: "bar",
					body,
					x: p.x,
					y: p.y,
					length: barLen,
					angle,
				});
			} else if (roll < BAR_CHANCE + TRI_CHANCE) {
				// spinning triangle peg — sharp apex sweeps around so balls
				// get deflected based on orientation at the moment of hit.
				const size = 20 + Math.random() * 10; // circumradius in px
				const angle = Math.random() * Math.PI * 2;
				const s = Math.sqrt(3) / 2;
				// CCW order (math convention): top apex → bottom-right → bottom-left.
				const verts = [
					planck.Vec2(0, -pxToM(size)),
					planck.Vec2(pxToM(size * s), pxToM(size / 2)),
					planck.Vec2(-pxToM(size * s), pxToM(size / 2)),
				];
				const body = world.createBody({
					type: "kinematic",
					position: planck.Vec2(pxToM(p.x), pxToM(p.y)),
					angle,
					angularVelocity:
						(Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 1.4),
				});
				body.createFixture({
					shape: planck.Polygon(verts),
					friction: 0.02,
					restitution: 0.82,
				});
				pegsRef.current.push({
					kind: "tri",
					body,
					x: p.x,
					y: p.y,
					size,
					angle,
				});
			} else {
				const body = world.createBody({
					type: "static",
					position: planck.Vec2(pxToM(p.x), pxToM(p.y)),
				});
				body.createFixture({
					shape: planck.Circle(pxToM(p.r)),
					friction: 0.0,
					restitution: 0.88,
				});
				pegsRef.current.push({
					kind: "peg",
					body,
					x: p.x,
					y: p.y,
					r: p.r,
				});
			}
		}
	}, []);

	useEffect(() => {
		const host = hostRef.current;
		const canvas = canvasRef.current;
		if (!host || !canvas) return;

		// Box2D coord convention: +x right, +y down (same as canvas). Positive
		// gravity pulls balls downward. 30 m/s² gives a fast-heavy feel close
		// to the earlier matter-js tuning (gravity.y=1.4 engine units).
		const world = new planck.World(planck.Vec2(0, 30));
		worldRef.current = world;

		// static anchor body for mouse-joint drag.
		const ground = world.createBody();
		groundBodyRef.current = ground;

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
			rebuildPegs(widthCss, heightCss);
		};
		applySize();

		canvas.style.touchAction = "none";

		// pointer-drag via MouseJoint — works for mouse + touch + pen.
		const pointerToWorld = (e: PointerEvent) => {
			const rect = canvas.getBoundingClientRect();
			return planck.Vec2(
				pxToM(e.clientX - rect.left),
				pxToM(e.clientY - rect.top),
			);
		};
		const onPointerDown = (e: PointerEvent) => {
			if (!groundBodyRef.current) return;
			const target = pointerToWorld(e);
			let hit: planck.Body | null = null;
			world.queryAABB(
				{
					lowerBound: planck.Vec2(target.x - 0.001, target.y - 0.001),
					upperBound: planck.Vec2(target.x + 0.001, target.y + 0.001),
				},
				(fixture) => {
					const body = fixture.getBody();
					if (body.getType() !== "dynamic") return true;
					if (!fixture.testPoint(target)) return true;
					hit = body;
					return false;
				},
			);
			if (!hit) return;
			const joint = planck.MouseJoint(
				{
					maxForce: 1000 * (hit as planck.Body).getMass(),
					frequencyHz: 5,
					dampingRatio: 0.7,
				},
				groundBodyRef.current,
				hit,
				target,
			);
			world.createJoint(joint);
			mouseJointRef.current = joint;
			canvas.setPointerCapture(e.pointerId);
		};
		const onPointerMove = (e: PointerEvent) => {
			if (!mouseJointRef.current) return;
			mouseJointRef.current.setTarget(pointerToWorld(e));
		};
		const onPointerUp = (e: PointerEvent) => {
			if (!mouseJointRef.current) return;
			world.destroyJoint(mouseJointRef.current);
			mouseJointRef.current = null;
			try {
				canvas.releasePointerCapture(e.pointerId);
			} catch {
				// pointer capture may already be released
			}
		};
		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", onPointerMove);
		canvas.addEventListener("pointerup", onPointerUp);
		canvas.addEventListener("pointercancel", onPointerUp);

		let lastShakeAt = performance.now();
		const tickDrainAndShake = () => {
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

			// stage 1 (~700ms stall): gentle random shake to break contacts.
			// only balls that have already reached the funnel region are
			// considered "stuck" — balls still mid-fall should be left alone.
			if (stallMs > 700 && now - lastShakeAt > 350) {
				lastShakeAt = now;
				for (const meta of ballsRef.current.values()) {
					if (meta.eliminated) continue;
					const py = mToPx(meta.body.getPosition().y);
					if (py < funnelTopY) continue;
					const v = meta.body.getLinearVelocity();
					meta.body.setLinearVelocity(
						planck.Vec2(v.x + (Math.random() - 0.5) * 1.5, v.y - 1.2),
					);
					meta.body.setAngularVelocity((Math.random() - 0.5) * 3);
					meta.body.setAwake(true);
				}
			}

			// stage 2 (~1500ms stall): actively pull funnel-region balls toward
			// the gap so wedged piles get un-stuck even on narrow mobile screens
			if (stallMs > 1500) {
				for (const meta of ballsRef.current.values()) {
					if (meta.eliminated) continue;
					const body = meta.body;
					const pos = body.getPosition();
					const py = mToPx(pos.y);
					if (py < funnelTopY) continue;
					const dx = cx - mToPx(pos.x);
					const absDx = Math.abs(dx);
					const mass = body.getMass();
					body.applyForceToCenter(
						planck.Vec2(absDx > 2 ? Math.sign(dx) * 3 * mass : 0, 6 * mass),
					);
					body.setAwake(true);
				}
			}

			for (const [body, meta] of ballsRef.current) {
				if (drainedBodiesRef.current.has(body)) continue;
				if (meta.eliminated) continue;
				const pos = body.getPosition();
				const px = mToPx(pos.x);
				const py = mToPx(pos.y);
				// drain zone is the bottom gap; widened y-tolerance so balls don't
				// skim past on a fast frame
				if (py > heightCss - 12 && px > leftEdge && px < rightEdge) {
					if (now - lastDrainAtRef.current > DRAIN_COOLDOWN_MS) {
						lastDrainAtRef.current = now;
						drainedBodiesRef.current.add(body);
						const team = meta.team;
						setExitedThisRound((prev) => [...prev, team]);
						playWhistle();
						setTimeout(() => {
							if (worldRef.current) worldRef.current.destroyBody(body);
							ballsRef.current.delete(body);
						}, 180);
					}
				} else if (py > threshold) {
					drainedBodiesRef.current.add(body);
					setExitedThisRound((prev) => [...prev, meta.team]);
					world.destroyBody(body);
					ballsRef.current.delete(body);
				}
			}
		};

		// fixed physics step decouples simulation from frame-time jitter so balls
		// fall smoothly even if requestAnimationFrame hiccups. any leftover sub-
		// frame time accumulates into the next step instead of stretching one.
		const FIXED_STEP_MS = 1000 / 60;
		const STEP_DT = FIXED_STEP_MS / 1000;
		let accumulator = 0;
		let lastTime = performance.now();
		const render = () => {
			if (!ctx) return;
			const now = performance.now();
			if (resetClockRef.current) {
				resetClockRef.current = false;
				lastTime = now;
				accumulator = 0;
			}
			const frame = Math.min(50, now - lastTime);
			lastTime = now;
			accumulator += frame;
			while (accumulator >= FIXED_STEP_MS) {
				world.step(STEP_DT, 8, 3);
				accumulator -= FIXED_STEP_MS;
			}
			tickDrainAndShake();

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

			// draw pegs and bars — shiny steel with a soft glow so the
			// ball/obstacle collisions read clearly.
			for (const peg of pegsRef.current) {
				if (peg.kind === "peg") {
					const pegGrad = ctx.createRadialGradient(
						peg.x - peg.r * 0.35,
						peg.y - peg.r * 0.35,
						peg.r * 0.2,
						peg.x,
						peg.y,
						peg.r,
					);
					pegGrad.addColorStop(0, "#ffffff");
					pegGrad.addColorStop(0.5, "#bfc6cf");
					pegGrad.addColorStop(1, "#6b7684");
					ctx.fillStyle = pegGrad;
					ctx.beginPath();
					ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
					ctx.fill();
					ctx.lineWidth = 1;
					ctx.strokeStyle = "rgba(0,0,0,0.25)";
					ctx.stroke();
				} else if (peg.kind === "bar") {
					ctx.save();
					ctx.translate(peg.x, peg.y);
					// read live angle — bars are kinematic and spin over time.
					ctx.rotate(peg.body.getAngle());
					const barThick = 8;
					const barGrad = ctx.createLinearGradient(0, -barThick, 0, barThick);
					barGrad.addColorStop(0, "#d7dde3");
					barGrad.addColorStop(0.5, "#8f99a5");
					barGrad.addColorStop(1, "#5a6472");
					ctx.fillStyle = barGrad;
					ctx.beginPath();
					// rounded ends for a pill shape
					const halfLen = peg.length / 2;
					const halfThick = barThick / 2;
					ctx.roundRect(-halfLen, -halfThick, peg.length, barThick, halfThick);
					ctx.fill();
					ctx.lineWidth = 1;
					ctx.strokeStyle = "rgba(0,0,0,0.3)";
					ctx.stroke();
					ctx.restore();
				} else {
					// triangle peg — scatter triangles are kinematic (spinning),
					// pyramid triangles are static (angle 0 stays 0), so reading
					// body angle gives the right value for both.
					ctx.save();
					ctx.translate(peg.x, peg.y);
					ctx.rotate(peg.body.getAngle());
					const s = Math.sqrt(3) / 2;
					const size = peg.size;
					const triGrad = ctx.createLinearGradient(0, -size, 0, size / 2);
					triGrad.addColorStop(0, "#eef1f5");
					triGrad.addColorStop(0.6, "#9aa4b0");
					triGrad.addColorStop(1, "#4f586a");
					ctx.fillStyle = triGrad;
					ctx.beginPath();
					ctx.moveTo(0, -size);
					ctx.lineTo(size * s, size / 2);
					ctx.lineTo(-size * s, size / 2);
					ctx.closePath();
					ctx.fill();
					ctx.lineWidth = 1;
					ctx.strokeStyle = "rgba(0,0,0,0.3)";
					ctx.stroke();
					ctx.restore();
				}
			}

			for (const [, meta] of ballsRef.current) {
				const body = meta.body;
				const r = meta.radius;
				const pos = body.getPosition();
				ctx.save();
				ctx.translate(mToPx(pos.x), mToPx(pos.y));
				ctx.rotate(body.getAngle());
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
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerup", onPointerUp);
			canvas.removeEventListener("pointercancel", onPointerUp);
			ballsRef.current.clear();
			wallsRef.current = [];
			pegsRef.current = [];
			worldRef.current = null;
			groundBodyRef.current = null;
			mouseJointRef.current = null;
		};
	}, [rebuildWalls, rebuildPegs]);

	const clearStageBalls = useCallback(() => {
		const world = worldRef.current;
		if (!world) return;
		for (const [body] of ballsRef.current) {
			world.destroyBody(body);
		}
		ballsRef.current.clear();
		drainedBodiesRef.current.clear();
		lastDrainAtRef.current = 0;
	}, []);

	const spawnRound = useCallback(() => {
		const world = worldRef.current;
		const host = hostRef.current;
		if (!world || !host) return;

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

		// re-scatter pegs so every round feels fresh.
		rebuildPegs(w, h);

		// grid-spawn so balls don't overlap above the canvas — random x/y
		// previously caused invisible mid-air collisions that looked like balls
		// bouncing off nothing when they first entered the visible area.
		const availableW = w - 80;
		const cellW = radius * 2 + 10;
		const cols = Math.max(1, Math.floor(availableW / cellW));
		const colWidth = availableW / cols;
		const rowGap = radius * 2 + 10;
		const totalRows = Math.ceil(roster.length / cols);
		const lastRowCount = roster.length - (totalRows - 1) * cols;
		// clamp jitter so adjacent balls (centers colWidth apart) never overlap:
		// need min gap of diameter + 2px between centers → max 2*jitter ≤
		// colWidth - diameter - 2.
		const maxJitter = Math.max(0, (colWidth - radius * 2 - 2) / 2);

		// build all textures and bodies up front so every ball starts falling on
		// the same frame — no stagger jank, no per-spawn texture work.
		for (let i = 0; i < roster.length; i += 1) {
			const team = roster[i];
			const col = i % cols;
			const row = Math.floor(i / cols);
			// the last (topmost) row can be partial; center its balls across the
			// stage instead of letting them bunch up on the left.
			const rowCount = row === totalRows - 1 ? lastRowCount : cols;
			const rowLeftPad = ((cols - rowCount) * colWidth) / 2;
			const xBase = 40 + rowLeftPad + col * colWidth + colWidth / 2;
			const xJitter = (Math.random() - 0.5) * maxJitter;
			// row 0 spawns just inside the top of the canvas so balls are
			// visible the instant the round starts — higher rows stack above
			// the top edge and fall into view within the next few frames.
			const yBase = radius + 4 - row * rowGap;
			const yJitter = (Math.random() - 0.5) * 2;

			const body = world.createBody({
				type: "dynamic",
				position: planck.Vec2(pxToM(xBase + xJitter), pxToM(yBase + yJitter)),
				linearDamping: 0.08,
				angularDamping: 0.3,
				// bullet is only needed for dynamic-vs-dynamic CCD; walls are
				// static and Planck already prevents tunneling through static
				// bodies, so we leave it off to save CPU.
				bullet: false,
				linearVelocity: planck.Vec2(pxToM((Math.random() - 0.5) * 12), 0),
				angularVelocity: (Math.random() - 0.5) * 0.5,
				allowSleep: true,
			});
			body.createFixture({
				shape: planck.Circle(pxToM(radius)),
				density: 1.0,
				friction: 0.05,
				restitution: 0.68,
			});

			ballsRef.current.set(body, {
				team,
				body,
				texture: buildBallTexture(team, radius, dpr),
				radius,
			});
		}

		// seed the drain clock to now so the stall-detection shake logic
		// doesn't fire on the very first frames (stallMs = now - 0 = huge
		// otherwise, which jerks every ball sideways mid-fall).
		lastDrainAtRef.current = performance.now();
		resetClockRef.current = true;
	}, [clearStageBalls, computeRadius, rebuildPegs, survivorsByRound]);

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
			for (const [body, meta] of ballsRef.current) {
				if (!drainedBodiesRef.current.has(body)) {
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
		const world = worldRef.current;
		const eliminated: Country[] = [];
		for (const [body, meta] of ballsRef.current) {
			if (drainedBodiesRef.current.has(body)) continue;
			meta.eliminated = true;
			eliminated.push(meta.team);
		}
		setEliminatedThisRound(eliminated);
		setRoundEnded(true);
		setRoundActive(false);

		// fade bodies out then remove
		setTimeout(() => {
			if (!world) return;
			for (const [body, meta] of ballsRef.current) {
				if (meta.eliminated) {
					world.destroyBody(body);
					ballsRef.current.delete(body);
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
						<div className="ball-tour-overlay ball-tour-overlay-next">
							<button
								type="button"
								className="btn btn-round"
								onClick={startRound}
							>
								{roundLabel(currentCount)} 시작
							</button>
						</div>
					)}
					{showNextButton && (
						<div className="ball-tour-overlay ball-tour-overlay-next">
							<button
								type="button"
								className="btn btn-round"
								onClick={goNextRound}
							>
								{roundLabel(nextCount)} 시작
							</button>
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
		</div>
	);
}
