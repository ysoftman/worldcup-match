import type { Country } from "../data/countries";
import type { Player, Position } from "../types";

// Mulberry32 seeded PRNG
function mulberry32(seed: number): () => number {
	let s = seed | 0;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// 국가 코드 → 시드 해시
function hashCode(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = (hash * 31 + str.charCodeAt(i)) | 0;
	}
	return hash;
}

// seeded random 범위 정수
function randInt(rng: () => number, min: number, max: number): number {
	return Math.floor(rng() * (max - min + 1)) + min;
}

// 포지션별 스탯 편향
const POSITION_BIAS: Record<Position, Record<string, number>> = {
	GK: {
		pace: -15,
		shooting: -20,
		passing: -5,
		dribbling: -15,
		defending: 5,
		physical: 5,
	},
	DEF: {
		pace: -3,
		shooting: -10,
		passing: 0,
		dribbling: -5,
		defending: 10,
		physical: 5,
	},
	MID: {
		pace: 0,
		shooting: 0,
		passing: 8,
		dribbling: 5,
		defending: -3,
		physical: -2,
	},
	FWD: {
		pace: 5,
		shooting: 10,
		passing: -2,
		dribbling: 5,
		defending: -15,
		physical: -3,
	},
};

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

// 국가 랭킹 기반 팀 기본 능력치
function teamBaseRating(rank: number): number {
	return Math.round(82 - (rank - 1) * 0.2);
}

// 선수 overall 생성 (스쿼드 내 순번에 따른 분포)
function generateOverall(
	rng: () => number,
	base: number,
	index: number,
): number {
	let overall: number;
	if (index < 3) {
		// 스타 선수
		overall = base + randInt(rng, 8, 12);
	} else if (index < 11) {
		// 주전
		overall = base + randInt(rng, 0, 7);
	} else if (index < 18) {
		// 백업
		overall = base + randInt(rng, -5, 0);
	} else {
		// 예비
		overall = base + randInt(rng, -10, -4);
	}
	return clamp(overall, 40, 99);
}

// 개별 스탯 생성
function generateStats(
	rng: () => number,
	overall: number,
	position: Position,
): Pick<
	Player,
	"pace" | "shooting" | "passing" | "dribbling" | "defending" | "physical"
> {
	const bias = POSITION_BIAS[position];
	return {
		pace: clamp(overall + bias.pace + randInt(rng, -5, 5), 30, 99),
		shooting: clamp(overall + bias.shooting + randInt(rng, -5, 5), 30, 99),
		passing: clamp(overall + bias.passing + randInt(rng, -5, 5), 30, 99),
		dribbling: clamp(overall + bias.dribbling + randInt(rng, -5, 5), 30, 99),
		defending: clamp(overall + bias.defending + randInt(rng, -5, 5), 30, 99),
		physical: clamp(overall + bias.physical + randInt(rng, -5, 5), 30, 99),
	};
}

// 포지션별 키/몸무게 범위
const PHYSICAL_RANGES: Record<
	Position,
	{ hMin: number; hMax: number; wMin: number; wMax: number }
> = {
	GK: { hMin: 185, hMax: 195, wMin: 78, wMax: 90 },
	DEF: { hMin: 178, hMax: 190, wMin: 73, wMax: 85 },
	MID: { hMin: 170, hMax: 185, wMin: 65, wMax: 78 },
	FWD: { hMin: 172, hMax: 188, wMin: 68, wMax: 82 },
};

function generatePhysical(
	rng: () => number,
	position: Position,
): { height: number; weight: number } {
	const r = PHYSICAL_RANGES[position];
	return {
		height: randInt(rng, r.hMin, r.hMax),
		weight: randInt(rng, r.wMin, r.wMax),
	};
}

// API 데이터에 능력치를 부착
export interface RawPlayer {
	id: number;
	name: string;
	position: string;
	age: number;
	number: number;
	height?: number;
	weight?: number;
	photo?: string;
}

function mapPosition(apiPosition: string): Position {
	switch (apiPosition) {
		case "Goalkeeper":
			return "GK";
		case "Defender":
			return "DEF";
		case "Midfielder":
			return "MID";
		case "Attacker":
			return "FWD";
		default:
			return "MID";
	}
}

export function attachRatings(
	rawPlayers: RawPlayer[],
	country: Country,
): Player[] {
	const rng = mulberry32(hashCode(country.code));
	const base = teamBaseRating(country.rank);

	// 포지션별로 분류 후 각 포지션 내에서 순번으로 등급 배정
	// (JSON 순서가 GK 먼저인 경우 GK가 스타급을 받는 문제 방지)
	const mapped = rawPlayers.map((raw) => ({
		raw,
		position: mapPosition(raw.position),
	}));

	const byPos: Record<string, typeof mapped> = {};
	for (const m of mapped) {
		if (!byPos[m.position]) byPos[m.position] = [];
		byPos[m.position].push(m);
	}

	// 전체 스쿼드 순번: 각 포지션에서 번갈아 뽑아 균등 분배
	const ordered: typeof mapped = [];
	const posKeys = ["FWD", "MID", "DEF", "GK"];
	const posIdxs: Record<string, number> = { FWD: 0, MID: 0, DEF: 0, GK: 0 };
	const total = mapped.length;

	while (ordered.length < total) {
		let added = false;
		for (const pos of posKeys) {
			const arr = byPos[pos];
			if (arr && posIdxs[pos] < arr.length) {
				ordered.push(arr[posIdxs[pos]]);
				posIdxs[pos]++;
				added = true;
				if (ordered.length >= total) break;
			}
		}
		if (!added) break;
	}

	// 순번으로 overall 생성 (idx 0~2 스타, 3~10 주전, ...)
	const withOverall = ordered.map((m, idx) => ({
		...m,
		overall: generateOverall(rng, base, idx),
	}));

	// overall 내림차순 정렬
	withOverall.sort((a, b) => b.overall - a.overall);

	return withOverall.map((p, idx) => {
		const phys =
			p.raw.height && p.raw.weight
				? { height: p.raw.height, weight: p.raw.weight }
				: generatePhysical(rng, p.position);
		const stats = generateStats(rng, p.overall, p.position);
		return {
			id: p.raw.id || idx + 1,
			name: p.raw.name,
			position: p.position,
			age: p.raw.age || randInt(rng, 20, 35),
			number: p.raw.number || idx + 1,
			height: phys.height,
			weight: phys.weight,
			photo: p.raw.photo,
			overall: p.overall,
			...stats,
		};
	});
}

// Fallback: 이름 풀 기반 가상 선수 생성
export {
	generateOverall,
	generatePhysical,
	generateStats,
	hashCode,
	mapPosition,
	mulberry32,
	randInt,
	teamBaseRating,
};
