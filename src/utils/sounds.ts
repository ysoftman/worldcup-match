let ctx: AudioContext | null = null;
let muted = localStorage.getItem("soundMuted") === "true";

const buffers: Record<string, AudioBuffer | null> = {
	whistle: null,
	goal: null,
	victory: null,
};

function getCtx(): AudioContext {
	if (!ctx) ctx = new AudioContext();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}

async function loadSound(
	key: string,
	url: string,
): Promise<AudioBuffer | null> {
	if (buffers[key]) return buffers[key];
	try {
		const c = getCtx();
		const res = await fetch(url);
		const arr = await res.arrayBuffer();
		buffers[key] = await c.decodeAudioData(arr);
		return buffers[key];
	} catch {
		return null;
	}
}

function playSoundFile(key: string, volume = 0.4) {
	if (muted) return;
	const buf = buffers[key];
	if (!buf) return;
	const c = getCtx();
	const src = c.createBufferSource();
	src.buffer = buf;
	const gain = c.createGain();
	gain.gain.value = volume;
	src.connect(gain).connect(c.destination);
	src.start(0);
}

// 앱 시작 시 사전 로드 (Vite base path 반영)
const base = import.meta.env.BASE_URL;
loadSound("whistle", `${base}sounds/whistle.wav`);
loadSound("goal", `${base}sounds/goal.wav`);
loadSound("victory", `${base}sounds/victory.wav`);

export function isMuted(): boolean {
	return muted;
}

export function setMuted(v: boolean) {
	muted = v;
	localStorage.setItem("soundMuted", String(v));
}

export function playWhistle() {
	getCtx();
	playSoundFile("whistle", 0.35);
}

// 골 사운드 쿨다운: 동시에 여러 매치가 재생 요청해도 하나만 재생
let lastGoalTime = 0;
const GOAL_COOLDOWN = 400;

export function playGoal() {
	const now = Date.now();
	if (now - lastGoalTime < GOAL_COOLDOWN) return;
	lastGoalTime = now;
	getCtx();
	playSoundFile("goal", 0.25);
}

export function playVictory() {
	getCtx();
	playSoundFile("victory", 0.4);
}

export function playClick() {
	if (muted) return;
	const c = getCtx();
	const osc = c.createOscillator();
	const gain = c.createGain();
	osc.type = "sine";
	osc.frequency.setValueAtTime(800, c.currentTime);
	gain.gain.setValueAtTime(0.06, c.currentTime);
	gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.06);
	osc.connect(gain).connect(c.destination);
	osc.start(c.currentTime);
	osc.stop(c.currentTime + 0.06);
}

// --- 배경음악 (BGM) ---
// SFX mute와는 독립적. HTMLAudioElement 싱글턴으로 loop 재생.
const BGM_URL = `${base}sounds/${encodeURIComponent("Raise That Flag.mp3")}`;
let bgmEl: HTMLAudioElement | null = null;
let bgmOn = localStorage.getItem("bgmOn") === "true";

function getBgmEl(): HTMLAudioElement {
	if (!bgmEl) {
		bgmEl = new Audio(BGM_URL);
		bgmEl.loop = true;
		bgmEl.volume = 0.3;
		bgmEl.preload = "auto";
	}
	return bgmEl;
}

export function isBgmOn(): boolean {
	return bgmOn;
}

export function setBgmOn(v: boolean) {
	bgmOn = v;
	localStorage.setItem("bgmOn", String(v));
	const el = getBgmEl();
	if (v) {
		// play()는 user-gesture 없이 호출되면 reject될 수 있음 → 실패해도 조용히 무시
		el.play().catch(() => {
			bgmOn = false;
			localStorage.setItem("bgmOn", "false");
		});
	} else {
		el.pause();
	}
}
