import type { Country } from "../data/countries";
import { getNamePool } from "../data/playerNames";
import rawData from "../data/players.json";
import type { Player, Position } from "../types";
import {
	attachRatings,
	generateOverall,
	generatePhysical,
	generateStats,
	hashCode,
	mulberry32,
	type RawPlayer,
	randInt,
	teamBaseRating,
} from "./playerRating";

const typedRawData = rawData as Record<string, RawPlayer[]>;

const squadCache = new Map<string, Player[]>();

// 포지션 분배: GK 3, DEF 8, MID 8, FWD 7 = 26명
const POSITION_DIST: Position[] = [
	"GK",
	"GK",
	"GK",
	"DEF",
	"DEF",
	"DEF",
	"DEF",
	"DEF",
	"DEF",
	"DEF",
	"DEF",
	"MID",
	"MID",
	"MID",
	"MID",
	"MID",
	"MID",
	"MID",
	"MID",
	"FWD",
	"FWD",
	"FWD",
	"FWD",
	"FWD",
	"FWD",
	"FWD",
];

// fallback: 가상 선수 26명 생성
function generateFallbackSquad(country: Country): Player[] {
	const rng = mulberry32(hashCode(country.code));
	const base = teamBaseRating(country.rank);
	const namePool = getNamePool(country.conf);
	const usedNames = new Set<string>();
	const players: Player[] = [];

	for (let i = 0; i < 26; i++) {
		const position = POSITION_DIST[i];

		// 이름 생성 (중복 방지)
		let name: string;
		let attempts = 0;
		do {
			const first = namePool.first[Math.floor(rng() * namePool.first.length)];
			const last = namePool.last[Math.floor(rng() * namePool.last.length)];
			name = `${first[0]}. ${last}`;
			attempts++;
		} while (usedNames.has(name) && attempts < 50);
		usedNames.add(name);

		const overall = generateOverall(rng, base, i);
		const stats = generateStats(rng, overall, position);
		const phys = generatePhysical(rng, position);

		players.push({
			id: i + 1,
			name,
			position,
			age: randInt(rng, 20, 35),
			number: i < 23 ? i + 1 : randInt(rng, 24, 99),
			height: phys.height,
			weight: phys.weight,
			overall,
			...stats,
		});
	}

	// overall 내림차순 정렬
	players.sort((a, b) => b.overall - a.overall);
	return players;
}

export function getSquad(country: Country): Player[] {
	if (squadCache.has(country.code)) {
		return squadCache.get(country.code)!;
	}

	const apiPlayers = typedRawData[country.code];
	let squad: Player[];

	if (apiPlayers && apiPlayers.length > 0) {
		squad = attachRatings(apiPlayers, country);
	} else {
		squad = generateFallbackSquad(country);
	}

	squadCache.set(country.code, squad);
	return squad;
}

// 포메이션에 맞는 최적 11명 자동 선택
export function autoSelectXI(
	squad: Player[],
	formationId: string,
): Set<number> {
	// 포메이션 파싱 (e.g., "4-3-3" → DEF:4, MID:3, FWD:3)
	const parts = formationId.split("-").map(Number);
	const needs: Record<Position, number> = { GK: 1, DEF: 0, MID: 0, FWD: 0 };

	if (parts.length === 3) {
		needs.DEF = parts[0];
		needs.MID = parts[1];
		needs.FWD = parts[2];
	} else if (parts.length === 4) {
		// e.g., "4-2-3-1" → DEF:4, MID:2+3=5, FWD:1
		needs.DEF = parts[0];
		needs.MID = parts[1] + parts[2];
		needs.FWD = parts[3];
	}

	const selected = new Set<number>();
	const byPosition: Record<Position, Player[]> = {
		GK: [],
		DEF: [],
		MID: [],
		FWD: [],
	};

	for (const p of squad) {
		byPosition[p.position].push(p);
	}

	// 각 포지션에서 OVR 높은 순으로 선택
	for (const pos of ["GK", "DEF", "MID", "FWD"] as Position[]) {
		const sorted = byPosition[pos].sort((a, b) => b.overall - a.overall);
		const count = needs[pos];
		for (let i = 0; i < count && i < sorted.length; i++) {
			selected.add(sorted[i].id);
		}
	}

	// 11명 미달 시 남은 선수 중 OVR 높은 순으로 보충
	if (selected.size < 11) {
		const remaining = squad
			.filter((p) => !selected.has(p.id))
			.sort((a, b) => b.overall - a.overall);
		for (const p of remaining) {
			if (selected.size >= 11) break;
			selected.add(p.id);
		}
	}

	return selected;
}
