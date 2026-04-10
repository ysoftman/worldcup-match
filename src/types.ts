import type { Country } from "./data/countries";

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
