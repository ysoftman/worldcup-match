import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18nContext";
import { playClick, playDrain, playGoal, playWhistle } from "../utils/sounds";

// --- scene geometry (SVG viewBox is 0 0 400 300) ------------------------
// everything is authored in these fixed coordinates and scaled to the
// container via preserveAspectRatio, so the game is fully responsive.
const GOAL_LEFT = 88;
const GOAL_RIGHT = 312;
const GOAL_TOP = 58;
const GOAL_LINE = 150;
const CENTER_X = 200;
const BALL_HOME = { x: CENTER_X, y: 258, scale: 1, rot: 0 };
const KEEPER_BASE_Y = 135;

// direction is a signed value in [-1, 1]; ±1 aims at a post, 0 dead center.
// the aim marker and the ball's landing x are both derived from it.
const AIM_SPREAD = 90; // px each side of center the shot can be placed
const HAND_SPREAD = 78; // how far the keeper's gloves reach when diving
const SAVE_REACH = 50; // glove coverage radius on the goal line

// oscillation speeds (rad/s) for the aim sweep and power meter.
const AIM_SPEED = 3.2;
const POWER_SPEED = 3.6;

const DIVE_ZONES = [-1, 0, 1] as const;

type Phase = "aim" | "power" | "shooting" | "result";
type Outcome = "goal" | "save" | "miss";

interface Shot {
	startX: number;
	startY: number;
	endX: number;
	endY: number;
	arc: number;
	keeperDive: number;
	result: Outcome;
	duration: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const clamp = (v: number, lo: number, hi: number) =>
	Math.max(lo, Math.min(hi, v));

// both direction AND power decide the outcome:
//   power < 16  → too soft, the keeper simply collects it (save)
//   power > 96  → blasted over the crossbar (miss)
//   otherwise   → goal, unless the keeper's dive covers the landing spot;
//                 a hard enough strike (power > 82) can still squeeze past.
function judge(dir: number, power: number, keeperDive: number): Outcome {
	if (power < 16) return "save";
	if (power > 96) return "miss";
	const landX = CENTER_X + dir * AIM_SPREAD;
	const handX = CENTER_X + keeperDive * HAND_SPREAD;
	if (Math.abs(landX - handX) < SAVE_REACH) {
		if (power > 82 && Math.random() < (power - 82) / 20) return "goal";
		return "save";
	}
	return "goal";
}

// a quick, celebratory burst — lighter than the champion finale so it can
// fire on every scored penalty without overwhelming the screen.
function fireGoalConfetti() {
	const colors = ["#d4ac0d", "#f1c40f", "#2ecc71", "#3498db", "#e74c3c"];
	confetti({ particleCount: 90, spread: 78, origin: { y: 0.45 }, colors });
	confetti({
		particleCount: 45,
		angle: 60,
		spread: 55,
		origin: { x: 0, y: 0.65 },
		colors,
	});
	confetti({
		particleCount: 45,
		angle: 120,
		spread: 55,
		origin: { x: 1, y: 0.65 },
		colors,
	});
}

export function PenaltyShootout({ onExit }: { onExit: () => void }) {
	const { t } = useI18n();

	const [phase, setPhase] = useState<Phase>("aim");
	// live oscillating value: the aim sweep (-1..1) or the power meter (0..1),
	// depending on the current phase.
	const [osc, setOsc] = useState(0);
	const [aimDir, setAimDir] = useState(0);
	const [attempts, setAttempts] = useState(0);
	const [goals, setGoals] = useState(0);
	const [outcome, setOutcome] = useState<Outcome | null>(null);
	const [cheerIdx, setCheerIdx] = useState(0);
	const [ball, setBall] = useState(BALL_HOME);
	const [keeperDive, setKeeperDive] = useState(0);
	const [keeperT, setKeeperT] = useState(0);

	// read by the click handler at the exact moment of the tap so the frozen
	// value matches what the player sees, without waiting on a state flush.
	const oscRef = useRef(0);
	const shotRef = useRef<Shot | null>(null);

	// aim / power oscillation loop. restarts whenever the phase flips so the
	// power meter always begins at zero right after the aim is locked.
	useEffect(() => {
		if (phase !== "aim" && phase !== "power") return;
		let raf = 0;
		const start = performance.now();
		const loop = (now: number) => {
			const elapsed = (now - start) / 1000;
			const value =
				phase === "aim"
					? Math.sin(elapsed * AIM_SPEED)
					: (1 - Math.cos(elapsed * POWER_SPEED)) / 2;
			oscRef.current = value;
			setOsc(value);
			raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [phase]);

	// flight animation: ball travels toward its target while the keeper
	// commits to a dive; the outcome (already decided) is applied on landing.
	useEffect(() => {
		if (phase !== "shooting") return;
		const shot = shotRef.current;
		if (!shot) return;
		let raf = 0;
		const start = performance.now();
		const loop = (now: number) => {
			const p = clamp((now - start) / shot.duration, 0, 1);
			const e = easeOut(p);
			const x = lerp(shot.startX, shot.endX, e);
			const y =
				lerp(shot.startY, shot.endY, e) - Math.sin(p * Math.PI) * shot.arc;
			const spin = shot.endX >= shot.startX ? 1 : -1;
			setBall({ x, y, scale: lerp(1, 0.5, e), rot: e * 540 * spin });
			// keeper reaches full extension ~55% into the flight.
			setKeeperT(clamp(p / 0.55, 0, 1));
			if (p < 1) {
				raf = requestAnimationFrame(loop);
				return;
			}
			// landed — reveal the verdict and tally it.
			setOutcome(shot.result);
			setAttempts((a) => a + 1);
			if (shot.result === "goal") {
				setGoals((g) => g + 1);
				playGoal();
				fireGoalConfetti();
			} else if (shot.result === "save") {
				playDrain();
			} else {
				playWhistle();
			}
			setPhase("result");
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [phase]);

	// tap the pitch to lock the aim, then again to lock the power and shoot.
	const advance = () => {
		if (phase === "aim") {
			setAimDir(oscRef.current);
			playClick();
			setPhase("power");
		} else if (phase === "power") {
			playClick();
			startShot(aimDir, oscRef.current * 100);
		}
	};

	const startShot = (dir: number, power: number) => {
		const keeperZone =
			DIVE_ZONES[Math.floor(Math.random() * DIVE_ZONES.length)];
		const result = judge(dir, power, keeperZone);
		const landX = CENTER_X + dir * AIM_SPREAD;
		const handX = CENTER_X + keeperZone * HAND_SPREAD;
		let endX = landX;
		let endY = 96;
		let arc = 14;
		if (result === "miss") {
			endY = 26; // sails over the bar
			arc = 0;
		} else if (result === "save") {
			endX = handX; // parried at the gloves
			endY = 104;
			arc = 12;
		}
		shotRef.current = {
			startX: BALL_HOME.x,
			startY: BALL_HOME.y,
			endX,
			endY,
			arc,
			keeperDive: keeperZone,
			result,
			duration: clamp(760 - power * 3, 430, 760),
		};
		setCheerIdx(Math.floor(Math.random() * 3));
		setKeeperDive(keeperZone);
		setKeeperT(0);
		setPhase("shooting");
	};

	const nextShot = () => {
		playClick();
		shotRef.current = null;
		setOutcome(null);
		setBall(BALL_HOME);
		setKeeperDive(0);
		setKeeperT(0);
		setOsc(0);
		oscRef.current = 0;
		setPhase("aim");
	};

	// --- derived render values ------------------------------------------
	const aimMarkerX = CENTER_X + osc * AIM_SPREAD;
	const lockedMarkerX = CENTER_X + aimDir * AIM_SPREAD;
	const gauge = phase === "power" ? osc : 0;
	const gaugeColor =
		gauge < 0.5 ? "#2ecc71" : gauge < 0.85 ? "#f1c40f" : "#e74c3c";

	const keeperX = CENTER_X + keeperDive * 52 * keeperT;
	const keeperY = KEEPER_BASE_Y - Math.abs(keeperDive) * 10 * keeperT;
	const keeperRot = keeperDive * 34 * keeperT;

	const hint =
		phase === "aim"
			? t("penalty.aimHint")
			: phase === "power"
				? t("penalty.powerHint")
				: "";

	const resultMsg = outcome
		? outcome === "goal"
			? t(`penalty.cheer${cheerIdx + 1}`)
			: t(`penalty.boo${cheerIdx + 1}`)
		: "";
	const resultTag =
		outcome === "goal"
			? "⚽ GOAL!"
			: outcome === "save"
				? "🧤 SAVE!"
				: "😖 MISS!";

	// net grid lines — keyed by their coordinate so keys stay stable/unique.
	const netVerticals = [];
	for (let x = GOAL_LEFT + 8; x < GOAL_RIGHT - 4; x += 15) netVerticals.push(x);
	const netHorizontals = [];
	for (let y = GOAL_TOP + 6; y < GOAL_LINE - 2; y += 13) netHorizontals.push(y);

	return (
		<div className="penalty">
			<div className="penalty-header">
				<h2 className="penalty-title">{t("penalty.title")}</h2>
				<div className="penalty-header-right">
					<span className="penalty-stats">
						{t("penalty.stats", { attempts, goals })}
					</span>
					<button type="button" className="btn penalty-exit" onClick={onExit}>
						{t("penalty.exit")}
					</button>
				</div>
			</div>

			<div className="penalty-stage">
				<svg
					className="penalty-svg"
					viewBox="0 0 400 300"
					preserveAspectRatio="xMidYMid meet"
					role="img"
					aria-label={t("penalty.title")}
				>
					<title>{t("penalty.title")}</title>
					<defs>
						<linearGradient id="penaltySky" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#8ec9f0" />
							<stop offset="1" stopColor="#cbe8fb" />
						</linearGradient>
						<linearGradient id="penaltyGrass" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#4caf50" />
							<stop offset="1" stopColor="#2e7d32" />
						</linearGradient>
						<radialGradient id="penaltyBallSphere" cx="0.35" cy="0.3" r="0.85">
							<stop offset="0" stopColor="#ffffff" />
							<stop offset="0.55" stopColor="#f4f4f4" />
							<stop offset="0.8" stopColor="#dcdcdc" />
							<stop offset="1" stopColor="#b0b0b0" />
						</radialGradient>
						<radialGradient id="penaltyBallShade" cx="0.62" cy="0.68" r="0.75">
							<stop offset="0.55" stopColor="rgba(0,0,0,0)" />
							<stop offset="1" stopColor="rgba(0,0,0,0.4)" />
						</radialGradient>
						<clipPath id="penaltyBallClip">
							<circle r="12" />
						</clipPath>
					</defs>

					{/* sky + mowed-stripe grass */}
					<rect x="0" y="0" width="400" height="170" fill="url(#penaltySky)" />
					<rect
						x="0"
						y="150"
						width="400"
						height="150"
						fill="url(#penaltyGrass)"
					/>
					{[160, 190, 220, 250, 280].map((y, i) => (
						<rect
							key={`stripe-${y}`}
							x="0"
							y={y}
							width="400"
							height="15"
							fill={i % 2 === 0 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
						/>
					))}

					{/* goal: net, then posts + crossbar on top */}
					<rect
						x={GOAL_LEFT + 4}
						y={GOAL_TOP + 4}
						width={GOAL_RIGHT - GOAL_LEFT - 8}
						height={GOAL_LINE - GOAL_TOP - 4}
						fill="rgba(255,255,255,0.08)"
					/>
					{netVerticals.map((x) => (
						<line
							key={`nv-${x}`}
							x1={x}
							y1={GOAL_TOP + 4}
							x2={x}
							y2={GOAL_LINE}
							stroke="rgba(255,255,255,0.5)"
							strokeWidth="0.6"
						/>
					))}
					{netHorizontals.map((y) => (
						<line
							key={`nh-${y}`}
							x1={GOAL_LEFT + 4}
							y1={y}
							x2={GOAL_RIGHT - 4}
							y2={y}
							stroke="rgba(255,255,255,0.5)"
							strokeWidth="0.6"
						/>
					))}
					<rect
						x={GOAL_LEFT}
						y={GOAL_TOP}
						width={GOAL_RIGHT - GOAL_LEFT}
						height="7"
						rx="3.5"
						fill="#f8f8f8"
						stroke="#c0c0c0"
						strokeWidth="0.8"
					/>
					<rect
						x={GOAL_LEFT}
						y={GOAL_TOP}
						width="7"
						height={GOAL_LINE - GOAL_TOP}
						rx="3.5"
						fill="#f8f8f8"
						stroke="#c0c0c0"
						strokeWidth="0.8"
					/>
					<rect
						x={GOAL_RIGHT - 7}
						y={GOAL_TOP}
						width="7"
						height={GOAL_LINE - GOAL_TOP}
						rx="3.5"
						fill="#f8f8f8"
						stroke="#c0c0c0"
						strokeWidth="0.8"
					/>

					{/* penalty spot */}
					<ellipse
						cx={CENTER_X}
						cy="262"
						rx="5"
						ry="2"
						fill="rgba(255,255,255,0.85)"
					/>

					{/* cartoon goalkeeper: big head, bold outlines, flat cel colors */}
					<ellipse
						cx={keeperX}
						cy="168"
						rx="22"
						ry="4"
						fill="rgba(0,0,0,0.22)"
					/>
					<g
						transform={`translate(${keeperX} ${keeperY}) rotate(${keeperRot})`}
						strokeLinejoin="round"
						strokeLinecap="round"
					>
						{/* boots + socks */}
						<ellipse
							cx="-8"
							cy="29"
							rx="6.5"
							ry="4"
							fill="#2b2e33"
							stroke="#26221f"
							strokeWidth="1.3"
						/>
						<ellipse
							cx="8"
							cy="29"
							rx="6.5"
							ry="4"
							fill="#2b2e33"
							stroke="#26221f"
							strokeWidth="1.3"
						/>
						<rect
							x="-10"
							y="6"
							width="6"
							height="21"
							rx="3"
							fill="#ff9130"
							stroke="#26221f"
							strokeWidth="1.3"
						/>
						<rect
							x="4"
							y="6"
							width="6"
							height="21"
							rx="3"
							fill="#ff9130"
							stroke="#26221f"
							strokeWidth="1.3"
						/>
						<rect
							x="-9.6"
							y="10"
							width="5.2"
							height="3.5"
							fill="#ffffff"
							opacity="0.9"
						/>
						<rect
							x="4.4"
							y="10"
							width="5.2"
							height="3.5"
							fill="#ffffff"
							opacity="0.9"
						/>
						{/* shorts + shirt */}
						<path
							d="M -12 -2 L 12 -2 L 13 9 L 2.5 10.5 L 0 6 L -2.5 10.5 L -13 9 Z"
							fill="#23406e"
							stroke="#26221f"
							strokeWidth="1.3"
						/>
						<rect
							x="-13"
							y="-21"
							width="26"
							height="22"
							rx="8"
							fill="#ff9130"
							stroke="#26221f"
							strokeWidth="1.4"
						/>
						<path
							d="M -11.5 -3 L 11.5 -3 L 11.5 -1 Q 0 1.5 -11.5 -1 Z"
							fill="rgba(0,0,0,0.12)"
						/>
						<text
							x="0"
							y="-6"
							textAnchor="middle"
							fontSize="9"
							fontWeight="800"
							fill="#fff"
						>
							1
						</text>
						{/* raised arms: outline stroke under a thinner jersey stroke */}
						<path d="M -10.5 -15 L -23 -35" stroke="#26221f" strokeWidth="9" />
						<path
							d="M -10.5 -15 L -23 -35"
							stroke="#ff9130"
							strokeWidth="6.4"
						/>
						<path d="M 10.5 -15 L 23 -35" stroke="#26221f" strokeWidth="9" />
						<path d="M 10.5 -15 L 23 -35" stroke="#ff9130" strokeWidth="6.4" />
						{/* oversized goalie mitts */}
						<circle
							cx="-25"
							cy="-38"
							r="5.5"
							fill="#ffffff"
							stroke="#26221f"
							strokeWidth="1.3"
						/>
						<circle
							cx="-20.6"
							cy="-41.2"
							r="2.2"
							fill="#ffffff"
							stroke="#26221f"
							strokeWidth="1.1"
						/>
						<path
							d="M -27.5 -42.5 L -27 -39.5 M -25 -43.5 L -24.8 -40.2 M -22.6 -43 L -22.8 -40"
							stroke="#26221f"
							strokeWidth="0.8"
						/>
						<circle
							cx="25"
							cy="-38"
							r="5.5"
							fill="#ffffff"
							stroke="#26221f"
							strokeWidth="1.3"
						/>
						<circle
							cx="20.6"
							cy="-41.2"
							r="2.2"
							fill="#ffffff"
							stroke="#26221f"
							strokeWidth="1.1"
						/>
						<path
							d="M 27.5 -42.5 L 27 -39.5 M 25 -43.5 L 24.8 -40.2 M 22.6 -43 L 22.8 -40"
							stroke="#26221f"
							strokeWidth="0.8"
						/>
						{/* big head + face */}
						<circle
							cx="0"
							cy="-32"
							r="13.5"
							fill="#ffcf9e"
							stroke="#26221f"
							strokeWidth="1.4"
						/>
						<path
							d="M -13 -36 Q -12 -46.5 0 -47 Q 12 -46.5 13 -36 L 13 -35 Q 9 -38 6.5 -35.5 Q 5 -39 1.5 -36.5 Q -2 -40 -5.5 -36.5 Q -9 -39 -13 -35 Z"
							fill="#6b4423"
							stroke="#26221f"
							strokeWidth="1.2"
						/>
						<ellipse
							cx="-4.8"
							cy="-33"
							rx="3"
							ry="3.6"
							fill="#fff"
							stroke="#26221f"
							strokeWidth="0.9"
						/>
						<ellipse
							cx="4.8"
							cy="-33"
							rx="3"
							ry="3.6"
							fill="#fff"
							stroke="#26221f"
							strokeWidth="0.9"
						/>
						<circle cx="-4.2" cy="-32.4" r="1.5" fill="#2a2a2a" />
						<circle cx="4.2" cy="-32.4" r="1.5" fill="#2a2a2a" />
						<circle cx="-4.7" cy="-33.2" r="0.6" fill="#fff" />
						<circle cx="3.7" cy="-33.2" r="0.6" fill="#fff" />
						<path
							d="M -7.5 -38.5 Q -4.8 -40 -2 -38.7"
							fill="none"
							stroke="#4a2f18"
							strokeWidth="1.4"
						/>
						<path
							d="M 7.5 -38.5 Q 4.8 -40 2 -38.7"
							fill="none"
							stroke="#4a2f18"
							strokeWidth="1.4"
						/>
						<ellipse
							cx="-9"
							cy="-27.5"
							rx="2"
							ry="1.2"
							fill="rgba(255,120,120,0.45)"
						/>
						<ellipse
							cx="9"
							cy="-27.5"
							rx="2"
							ry="1.2"
							fill="rgba(255,120,120,0.45)"
						/>
						<circle cx="0" cy="-29" r="0.9" fill="#f0aa76" />
						<path
							d="M -4 -25.5 Q 0 -21 4 -25.5 Q 0 -23.5 -4 -25.5 Z"
							fill="#7a3b2e"
							stroke="#26221f"
							strokeWidth="0.8"
						/>
					</g>

					{/* aim marker (live during aim, faded lock during power) */}
					{phase === "aim" && (
						<g>
							<circle
								cx={aimMarkerX}
								cy="100"
								r="10"
								fill="none"
								stroke="#e74c3c"
								strokeWidth="3"
							/>
							<line
								x1={aimMarkerX - 14}
								y1="100"
								x2={aimMarkerX + 14}
								y2="100"
								stroke="#e74c3c"
								strokeWidth="2"
							/>
							<line
								x1={aimMarkerX}
								y1="86"
								x2={aimMarkerX}
								y2="114"
								stroke="#e74c3c"
								strokeWidth="2"
							/>
						</g>
					)}
					{phase === "power" && (
						<circle
							cx={lockedMarkerX}
							cy="100"
							r="9"
							fill="none"
							stroke="rgba(231,76,60,0.55)"
							strokeWidth="3"
							strokeDasharray="4 3"
						/>
					)}

					{/* power meter */}
					{phase === "power" && (
						<g>
							<rect
								x="352"
								y="70"
								width="16"
								height="140"
								rx="8"
								fill="rgba(0,0,0,0.25)"
							/>
							<rect
								x="352"
								y={70 + 140 * (1 - gauge)}
								width="16"
								height={140 * gauge}
								rx="8"
								fill={gaugeColor}
							/>
							<text
								x="360"
								y="224"
								textAnchor="middle"
								fontSize="11"
								fontWeight="700"
								fill="#fff"
							>
								⚡
							</text>
						</g>
					)}

					{/* ball + ground shadow */}
					<ellipse
						cx={ball.x}
						cy="270"
						rx={11 * ball.scale}
						ry={3.5 * ball.scale}
						fill="rgba(0,0,0,0.2)"
					/>
					<g
						transform={`translate(${ball.x} ${ball.y}) scale(${ball.scale}) rotate(${ball.rot})`}
					>
						<circle r="12" fill="url(#penaltyBallSphere)" />
						{/* classic truncated-icosahedron look: one center pentagon,
						    five partial ones clipped at the silhouette, radial seams */}
						<g clipPath="url(#penaltyBallClip)">
							<polygon
								points="0,-4.4 4.18,-1.36 2.59,3.56 -2.59,3.56 -4.18,-1.36"
								fill="#23262b"
							/>
							<polygon
								points="9.17,-12.62 10.84,-7.48 6.47,-4.3 2.1,-7.48 3.77,-12.62"
								fill="#23262b"
							/>
							<polygon
								points="14.83,4.82 10.46,8 6.09,4.82 7.76,-0.32 13.16,-0.32"
								fill="#23262b"
							/>
							<polygon
								points="0,15.6 -4.37,12.42 -2.7,7.28 2.7,7.28 4.37,12.42"
								fill="#23262b"
							/>
							<polygon
								points="-14.83,4.82 -10.46,8 -6.09,4.82 -7.76,-0.32 -13.16,-0.32"
								fill="#23262b"
							/>
							<polygon
								points="-9.17,-12.62 -10.84,-7.48 -6.47,-4.3 -2.1,-7.48 -3.77,-12.62"
								fill="#23262b"
							/>
							<g stroke="rgba(0,0,0,0.28)" strokeWidth="0.7">
								<line x1="0" y1="-4.4" x2="0" y2="-12" />
								<line x1="4.18" y1="-1.36" x2="11.41" y2="-3.71" />
								<line x1="2.59" y1="3.56" x2="7.05" y2="9.71" />
								<line x1="-2.59" y1="3.56" x2="-7.05" y2="9.71" />
								<line x1="-4.18" y1="-1.36" x2="-11.41" y2="-3.71" />
							</g>
						</g>
						<circle r="12" fill="url(#penaltyBallShade)" />
						<circle
							r="12"
							fill="none"
							stroke="rgba(0,0,0,0.35)"
							strokeWidth="0.5"
						/>
					</g>
				</svg>

				{/* transparent capture layer — accessible click target while aiming */}
				{(phase === "aim" || phase === "power") && (
					<button
						type="button"
						className="penalty-capture"
						onClick={advance}
						aria-label={hint}
					/>
				)}

				{hint && <div className="penalty-hint">{hint}</div>}

				{phase === "result" && outcome && (
					<div className="penalty-result">
						<div className={`penalty-result-tag penalty-${outcome}`}>
							{resultTag}
						</div>
						<div className="penalty-result-msg">{resultMsg}</div>
						<div className="penalty-actions">
							<button
								type="button"
								className="btn penalty-again"
								onClick={nextShot}
							>
								{t("penalty.again")}
							</button>
							<button
								type="button"
								className="btn penalty-exit"
								onClick={onExit}
							>
								{t("penalty.exit")}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
