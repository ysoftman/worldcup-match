import type { Country } from "./data/countries";

export type Position = "GK" | "DEF" | "MID" | "FWD";

export const POSITION_LABELS: Record<Position, string> = {
	GK: "GK",
	DEF: "DF",
	MID: "MF",
	FWD: "FW",
};

export interface Player {
	id: number;
	name: string;
	position: Position;
	age: number;
	number: number;
	height: number;
	weight: number;
	photo?: string;
	overall: number;
	pace: number;
	shooting: number;
	passing: number;
	dribbling: number;
	defending: number;
	physical: number;
}

export interface Match {
	id: string;
	team1: Country;
	team2: Country;
	score1: number;
	score2: number;
	winner: Country | null;
	played: boolean;
}

export interface GroupMatch {
	id: string;
	team1: Country;
	team2: Country;
	score1: number;
	score2: number;
	played: boolean;
}

export interface GroupStanding {
	team: Country;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	goalsFor: number;
	goalsAgainst: number;
	points: number;
}

export interface Group {
	name: string;
	teams: Country[];
	matches: GroupMatch[];
	standings: GroupStanding[];
	played: boolean;
}

export interface TeamStats {
	played: number;
	wins: number;
	draws: number;
	losses: number;
	winRate: number;
}

export interface Round {
	name: string;
	matches: Match[];
}

export interface Formation {
	id: string;
	label: string;
	atkMod: number; // 공격력 보정 (자기 팀 골 기대값 증감)
	defMod: number; // 수비력 보정 (상대 팀 골 기대값 차감)
}

export const FORMATIONS: Formation[] = [
	{ id: "4-4-2", label: "4-4-2", atkMod: 0, defMod: 0 },
	{ id: "4-3-3", label: "4-3-3", atkMod: 0.4, defMod: -0.2 },
	{ id: "4-2-3-1", label: "4-2-3-1", atkMod: 0.2, defMod: 0.1 },
	{ id: "3-5-2", label: "3-5-2", atkMod: 0, defMod: 0.25 },
	{ id: "3-4-3", label: "3-4-3", atkMod: 0.6, defMod: -0.4 },
	{ id: "5-3-2", label: "5-3-2", atkMod: -0.3, defMod: 0.5 },
	{ id: "5-4-1", label: "5-4-1", atkMod: -0.5, defMod: 0.6 },
	{ id: "4-5-1", label: "4-5-1", atkMod: -0.2, defMod: 0.35 },
];

export const DEFAULT_FORMATION_ID = "4-4-2";

export function getFormation(id?: string): Formation {
	return FORMATIONS.find((f) => f.id === id) ?? FORMATIONS[0];
}

export type TournamentSize = 32 | 48;

export type RoundName = "round32" | "round16" | "quarter" | "semi" | "final";

export const ROUND_LABELS: Record<RoundName, string> = {
	round32: "32강",
	round16: "16강",
	quarter: "8강",
	semi: "4강",
	final: "결승",
};

// 48팀: 12조 → 32강 → 16강 → 8강 → 4강 → 결승
// 32팀: 8조 → 16강 → 8강 → 4강 → 결승
export const ROUND_ORDER_48: RoundName[] = [
	"round32",
	"round16",
	"quarter",
	"semi",
	"final",
];

export const ROUND_ORDER_32: RoundName[] = [
	"round16",
	"quarter",
	"semi",
	"final",
];
