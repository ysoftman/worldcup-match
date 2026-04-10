import type { Country } from "../data/countries";
import { ALL_COUNTRIES } from "../data/countries";
import type {
	Group,
	GroupMatch,
	GroupStanding,
	Match,
	TeamStats,
	TournamentSize,
} from "../types";

function shuffle<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

export function selectTeams(count: number): Country[] {
	return shuffle(ALL_COUNTRIES).slice(0, count);
}

const GROUP_NAMES_8 = ["A조", "B조", "C조", "D조", "E조", "F조", "G조", "H조"];
const GROUP_NAMES_12 = [
	"A조",
	"B조",
	"C조",
	"D조",
	"E조",
	"F조",
	"G조",
	"H조",
	"I조",
	"J조",
	"K조",
	"L조",
];

// 프리셋 조편성으로 그룹 생성
export function createGroupsFromPreset(
	presetGroups: { name: string; teams: Country[] }[],
): Group[] {
	return presetGroups.map((pg) => {
		const matches = createGroupMatches(pg.teams, pg.name);
		const standings = pg.teams.map((team) => ({
			team,
			played: 0,
			wins: 0,
			draws: 0,
			losses: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			points: 0,
		}));
		return {
			name: pg.name,
			teams: pg.teams,
			matches,
			standings,
			played: false,
		};
	});
}

// 팀을 조로 나누기
export function createGroups(teams: Country[], size: TournamentSize): Group[] {
	const groupCount = size === 48 ? 12 : 8;
	const teamsPerGroup = size === 48 ? 4 : 4;
	const groupNames = size === 48 ? GROUP_NAMES_12 : GROUP_NAMES_8;
	const groups: Group[] = [];

	for (let i = 0; i < groupCount; i++) {
		const groupTeams = teams.slice(
			i * teamsPerGroup,
			i * teamsPerGroup + teamsPerGroup,
		);
		const matches = createGroupMatches(groupTeams, groupNames[i]);
		const standings = groupTeams.map((team) => ({
			team,
			played: 0,
			wins: 0,
			draws: 0,
			losses: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			points: 0,
		}));
		groups.push({
			name: groupNames[i],
			teams: groupTeams,
			matches,
			standings,
			played: false,
		});
	}
	return groups;
}

// 조별 라운드 로빈 매치 생성 (4팀 → 6경기)
function createGroupMatches(teams: Country[], groupName: string): GroupMatch[] {
	const matches: GroupMatch[] = [];
	let idx = 0;
	for (let i = 0; i < teams.length; i++) {
		for (let j = i + 1; j < teams.length; j++) {
			matches.push({
				id: `${groupName}-${idx}`,
				team1: teams[i],
				team2: teams[j],
				score1: 0,
				score2: 0,
				played: false,
			});
			idx++;
		}
	}
	return matches;
}

// 랭킹 기반 골 기대값 계산 (랭킹 높을수록 더 많은 골 기대)
function rankToStrength(rank: number): number {
	// 1위 → 3.0, 50위 → 1.5, 140위 → 0.8
	return Math.max(0.8, 3.0 - (rank - 1) * 0.016);
}

function weightedGoals(strength: number): number {
	// 포아송 분포 근사: 평균=strength 기반 랜덤 골
	let goals = 0;
	let p = Math.exp(-strength);
	let cdf = p;
	const u = Math.random();
	while (u > cdf && goals < 8) {
		goals++;
		p *= strength / goals;
		cdf += p;
	}
	return goals;
}

// 단일 조별 매치 시뮬레이션 (무승부 허용, 랭킹 반영)
export function simulateGroupMatch(match: GroupMatch): GroupMatch {
	const s1 = rankToStrength(match.team1.rank);
	const s2 = rankToStrength(match.team2.rank);
	const score1 = weightedGoals(s1);
	const score2 = weightedGoals(s2);
	return { ...match, score1, score2, played: true };
}

// 플레이된 매치 기반 순위 재계산
export function recalcStandings(group: Group): GroupStanding[] {
	const standingMap = new Map<string, GroupStanding>();
	for (const team of group.teams) {
		standingMap.set(team.code, {
			team,
			played: 0,
			wins: 0,
			draws: 0,
			losses: 0,
			goalsFor: 0,
			goalsAgainst: 0,
			points: 0,
		});
	}

	for (const m of group.matches) {
		if (!m.played) continue;
		const s1 = standingMap.get(m.team1.code);
		const s2 = standingMap.get(m.team2.code);
		if (!s1 || !s2) continue;

		s1.played++;
		s2.played++;
		s1.goalsFor += m.score1;
		s1.goalsAgainst += m.score2;
		s2.goalsFor += m.score2;
		s2.goalsAgainst += m.score1;

		if (m.score1 > m.score2) {
			s1.wins++;
			s1.points += 3;
			s2.losses++;
		} else if (m.score1 < m.score2) {
			s2.wins++;
			s2.points += 3;
			s1.losses++;
		} else {
			s1.draws++;
			s2.draws++;
			s1.points += 1;
			s2.points += 1;
		}
	}

	// 순위 정렬: 승점 → 골득실 → 다득점
	return Array.from(standingMap.values()).sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		const gdA = a.goalsFor - a.goalsAgainst;
		const gdB = b.goalsFor - b.goalsAgainst;
		if (gdB !== gdA) return gdB - gdA;
		return b.goalsFor - a.goalsFor;
	});
}

// 조별 리그 전체 시뮬레이션
export function simulateGroup(group: Group): Group {
	const matches = group.matches.map((m) =>
		m.played ? m : simulateGroupMatch(m),
	);
	const updated = { ...group, matches };
	const standings = recalcStandings(updated);
	return { ...updated, standings, played: true };
}

// 32팀 대회: 각 조 상위 2팀 (8조 × 2 = 16팀, 교차 대진)
export function getGroupAdvancers32(groups: Group[]): Country[] {
	const advancers: Country[] = [];
	for (let i = 0; i < groups.length; i += 2) {
		const g1 = groups[i];
		const g2 = groups[i + 1];
		advancers.push(g1.standings[0].team);
		advancers.push(g2.standings[1].team);
		advancers.push(g2.standings[0].team);
		advancers.push(g1.standings[1].team);
	}
	return advancers;
}

// 48팀 대회: 각 조 상위 2팀 + 3위 중 상위 8팀 = 32팀
export function getGroupAdvancers48(groups: Group[]): Country[] {
	const top2: Country[] = [];
	const thirds: GroupStanding[] = [];

	for (const g of groups) {
		top2.push(g.standings[0].team);
		top2.push(g.standings[1].team);
		thirds.push(g.standings[2]);
	}

	// 3위 중 상위 8팀 (승점 → 골득실 → 다득점)
	thirds.sort((a, b) => {
		if (b.points !== a.points) return b.points - a.points;
		const gdA = a.goalsFor - a.goalsAgainst;
		const gdB = b.goalsFor - b.goalsAgainst;
		if (gdB !== gdA) return gdB - gdA;
		return b.goalsFor - a.goalsFor;
	});
	const best8thirds = thirds.slice(0, 8).map((s) => s.team);

	// 32강 대진: 1위 vs 와일드카드, 2위 vs 와일드카드 교차 배치
	const advancers: Country[] = [];
	for (let i = 0; i < 12; i += 2) {
		advancers.push(groups[i].standings[0].team);
		advancers.push(groups[i + 1].standings[1].team);
	}
	for (let i = 0; i < 12; i += 2) {
		advancers.push(groups[i + 1].standings[0].team);
		advancers.push(groups[i].standings[1].team);
	}
	// 와일드카드 8팀 추가
	for (let i = 0; i < best8thirds.length; i += 2) {
		advancers.push(best8thirds[i]);
		advancers.push(best8thirds[i + 1]);
	}
	return advancers;
}

export function getGroupAdvancers(
	groups: Group[],
	size: TournamentSize,
): Country[] {
	return size === 48
		? getGroupAdvancers48(groups)
		: getGroupAdvancers32(groups);
}

export function getAdvanceCount(size: TournamentSize): number {
	// 48팀: 각 조 2팀 + 3위 중 8팀 = 32팀
	// 32팀: 각 조 2팀 = 16팀
	return size === 48 ? 2 : 2; // 기본 진출 수 (3위 와일드카드는 별도 처리)
}

// 토너먼트 매치 생성
export function createMatches(teams: Country[], roundPrefix: string): Match[] {
	const matches: Match[] = [];
	for (let i = 0; i < teams.length; i += 2) {
		matches.push({
			id: `${roundPrefix}-${i / 2}`,
			team1: teams[i],
			team2: teams[i + 1],
			score1: 0,
			score2: 0,
			winner: null,
			played: false,
		});
	}
	return matches;
}

// 토너먼트 단일 매치 시뮬레이션 (무승부 없음, 승부차기, 랭킹 반영)
export function simulateMatch(match: Match): Match {
	const s1 = rankToStrength(match.team1.rank);
	const s2 = rankToStrength(match.team2.rank);
	let score1 = weightedGoals(s1);
	let score2 = weightedGoals(s2);

	// 동점이면 랭킹 높은 쪽이 약간 유리한 승부차기
	if (score1 === score2) {
		const advantage = s1 / (s1 + s2);
		if (Math.random() < advantage) {
			score1 += 1;
		} else {
			score2 += 1;
		}
	}

	return {
		...match,
		score1,
		score2,
		winner: score1 > score2 ? match.team1 : match.team2,
		played: true,
	};
}

export function simulateRound(matches: Match[]): Match[] {
	return matches.map((m) => (m.played ? m : simulateMatch(m)));
}

export function getWinners(matches: Match[]): Country[] {
	return matches
		.filter((m): m is Match & { winner: Country } => m.winner !== null)
		.map((m) => m.winner);
}

// 팀별 승률 계산 (조별 리그 + 토너먼트 전체)
export function calcTeamStats(
	groups: Group[],
	knockoutMatches: Match[],
): Map<string, TeamStats> {
	const stats = new Map<string, TeamStats>();

	const ensure = (code: string) => {
		if (!stats.has(code)) {
			stats.set(code, {
				played: 0,
				wins: 0,
				draws: 0,
				losses: 0,
				winRate: 0,
			});
		}
		return stats.get(code) as TeamStats;
	};

	for (const g of groups) {
		for (const m of g.matches) {
			if (!m.played) continue;
			const s1 = ensure(m.team1.code);
			const s2 = ensure(m.team2.code);
			s1.played++;
			s2.played++;
			if (m.score1 > m.score2) {
				s1.wins++;
				s2.losses++;
			} else if (m.score1 < m.score2) {
				s2.wins++;
				s1.losses++;
			} else {
				s1.draws++;
				s2.draws++;
			}
		}
	}

	for (const m of knockoutMatches) {
		if (!m.played) continue;
		const s1 = ensure(m.team1.code);
		const s2 = ensure(m.team2.code);
		s1.played++;
		s2.played++;
		if (m.winner?.code === m.team1.code) {
			s1.wins++;
			s2.losses++;
		} else {
			s2.wins++;
			s1.losses++;
		}
	}

	for (const s of stats.values()) {
		s.winRate = s.played > 0 ? Math.round((s.wins / s.played) * 100) : 0;
	}

	return stats;
}
