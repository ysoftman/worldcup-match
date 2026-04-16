import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BracketView } from "./components/BracketView";
import { Champion } from "./components/Champion";
import { FifaRanking } from "./components/FifaRanking";
import { GroupView } from "./components/GroupView";
import { SquadModal } from "./components/SquadModal";
import { TeamSelector } from "./components/TeamSelector";
import { saveWinner, WinnerHistory } from "./components/WinnerHistory";
import type { Country } from "./data/countries";
import type { Preset } from "./data/presets";
import { ALL_PRESETS } from "./data/presets";
import type { Group, Match, RoundName, TournamentSize } from "./types";
import {
	FORMATIONS,
	ROUND_LABELS,
	ROUND_ORDER_32,
	ROUND_ORDER_48,
} from "./types";
import {
	isMuted,
	playClick,
	playVictory,
	playWhistle,
	setMuted,
} from "./utils/sounds";
import {
	calcTeamStats,
	createGroups,
	createGroupsFromPreset,
	createMatches,
	getGroupAdvancers,
	getWildcardThirds,
	getWinners,
	recalcStandings,
	selectTeams,
	shuffle,
	simulateGroup,
	simulateGroupMatch,
	simulateMatch,
	simulateRound,
} from "./utils/tournament";
import "./App.css";

type Phase = "select" | "group" | "knockout" | "finished";

// 골 카운트업 애니메이션 대기 시간 (ms)
const SCORE_ANIM_DELAY = 2200;

interface RoundData {
	name: RoundName;
	label: string;
	matches: Match[];
}

function getInitialTheme(): "light" | "dark" {
	const saved = localStorage.getItem("theme");
	if (saved === "light" || saved === "dark") return saved;
	return "dark";
}

function randomFormations(teams: Country[]): Map<string, string> {
	const map = new Map<string, string>();
	for (const t of teams) {
		const f = FORMATIONS[Math.floor(Math.random() * FORMATIONS.length)];
		if (f.id !== "4-4-2") {
			map.set(t.code, f.id);
		}
	}
	return map;
}

function App() {
	const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("theme", theme);
	}, [theme]);

	const toggleTheme = useCallback(() => {
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));
	}, []);

	const [soundOn, setSoundOn] = useState(!isMuted());
	const toggleSound = useCallback(() => {
		const next = !soundOn;
		setSoundOn(next);
		setMuted(!next);
	}, [soundOn]);

	const [phase, setPhase] = useState<Phase>("select");
	const [tournamentSize, setTournamentSize] = useState<TournamentSize>(32);
	const [presetLabel, setPresetLabel] = useState<string | null>(null);
	const [selectedTeams, setSelectedTeams] = useState<Country[]>(() =>
		selectTeams(32),
	);
	const [groups, setGroups] = useState<Group[]>([]);
	const [rounds, setRounds] = useState<RoundData[]>([]);
	const [currentRoundIndex, setCurrentRoundIndex] = useState(-1);
	const [champion, setChampion] = useState<Country | null>(null);
	const [animatingMatchIds, setAnimatingMatchIds] = useState<Set<string>>(
		() => new Set(),
	);
	const [teamModifiers, setTeamModifiers] = useState<Map<string, number>>(
		() => new Map(),
	);
	const [teamFormations, setTeamFormations] = useState<Map<string, string>>(
		() => new Map(),
	);
	const [swapSelection, setSwapSelection] = useState<{
		groupName: string;
		team: Country;
	} | null>(null);
	const [squadModal, setSquadModal] = useState<{
		team: Country;
		readOnly: boolean;
	} | null>(null);
	const [selectedXI, setSelectedXI] = useState<Map<string, Set<number>>>(
		() => new Map(),
	);
	const animTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map(),
	);

	const roundOrder = tournamentSize === 48 ? ROUND_ORDER_48 : ROUND_ORDER_32;

	const allKnockoutMatches = useMemo(
		() => rounds.flatMap((r) => r.matches),
		[rounds],
	);
	const teamStats = useMemo(
		() => calcTeamStats(groups, allKnockoutMatches),
		[groups, allKnockoutMatches],
	);

	// 48강: 3위 와일드카드 진출 팀 코드 Set
	const wildcardCodes = useMemo(() => {
		if (tournamentSize !== 48 || !groups.every((g) => g.played)) {
			return new Set<string>();
		}
		return getWildcardThirds(groups);
	}, [groups, tournamentSize]);

	// 우승 기록 저장
	const recordWinner = useCallback(
		(winner: Country, opponent?: Country) => {
			const stats = teamStats.get(winner.code);
			saveWinner({
				flag: winner.flag,
				nameKo: winner.nameKo,
				name: winner.name,
				rank: winner.rank,
				size: tournamentSize,
				winRate: stats?.winRate ?? 0,
				date: new Date().toLocaleDateString("ko-KR"),
				opponentFlag: opponent?.flag,
				opponentNameKo: opponent?.nameKo,
			});
		},
		[teamStats, tournamentSize],
	);

	const groupAllDone = groups.length > 0 && groups.every((g) => g.played);
	const currentRound =
		currentRoundIndex >= 0 ? rounds[currentRoundIndex] : null;
	const hasUnplayedGroupMatches =
		groups.length > 0 && groups.some((g) => g.matches.some((m) => !m.played));

	// 대회 규모 변경
	const changeTournamentSize = useCallback((size: TournamentSize) => {
		setTournamentSize(size);
		setSelectedTeams(selectTeams(size));
	}, []);

	// 프리셋 적용
	const applyPreset = useCallback((preset: Preset) => {
		setTournamentSize(preset.size);
		setPresetLabel(preset.label);
		setSwapSelection(null);
		const allTeams = preset.groups.flatMap((g) => g.teams);
		setSelectedTeams(allTeams);
		const newGroups = createGroupsFromPreset(preset.groups);
		setGroups(newGroups);
		setTeamFormations(randomFormations(allTeams));
		setRounds([]);
		setCurrentRoundIndex(-1);
		setChampion(null);
		setPhase("group");
	}, []);

	// 대회 시작
	const startTournament = useCallback(() => {
		if (selectedTeams.length !== tournamentSize) return;
		setPresetLabel(null);
		setSwapSelection(null);
		const shuffled = shuffle(selectedTeams);
		const newGroups = createGroups(shuffled, tournamentSize);
		setGroups(newGroups);
		setTeamFormations(randomFormations(shuffled));
		setRounds([]);
		setCurrentRoundIndex(-1);
		setChampion(null);
		setPhase("group");
	}, [selectedTeams, tournamentSize]);

	// 조별 리그 팀 교환 (경기 시작 전만 가능)
	const handleSwapSelect = useCallback(
		(groupName: string, team: Country) => {
			if (!swapSelection) {
				setSwapSelection({ groupName, team });
				return;
			}
			// 같은 팀 다시 클릭 → 선택 해제
			if (
				swapSelection.groupName === groupName &&
				swapSelection.team.code === team.code
			) {
				setSwapSelection(null);
				return;
			}
			// 같은 조 안에서 클릭 → 대상 변경
			if (swapSelection.groupName === groupName) {
				setSwapSelection({ groupName, team });
				return;
			}
			// 다른 조의 팀 클릭 → 교환 실행
			const { groupName: fromGroup, team: fromTeam } = swapSelection;
			const toGroup = groupName;
			const toTeam = team;
			playClick();
			setGroups((prev) =>
				prev.map((g) => {
					if (g.name !== fromGroup && g.name !== toGroup) return g;
					const newTeams = g.teams.map((t) => {
						if (g.name === fromGroup && t.code === fromTeam.code) return toTeam;
						if (g.name === toGroup && t.code === toTeam.code) return fromTeam;
						return t;
					});
					// 매치 재생성 (조 멤버가 바뀌었으므로)
					const groupMatches: typeof g.matches = [];
					let idx = 0;
					for (let i = 0; i < newTeams.length; i++) {
						for (let j = i + 1; j < newTeams.length; j++) {
							groupMatches.push({
								id: `${g.name}-${idx}`,
								team1: newTeams[i],
								team2: newTeams[j],
								score1: 0,
								score2: 0,
								played: false,
							});
							idx++;
						}
					}
					const standings = newTeams.map((t) => ({
						team: t,
						played: 0,
						wins: 0,
						draws: 0,
						losses: 0,
						goalsFor: 0,
						goalsAgainst: 0,
						points: 0,
					}));
					return {
						...g,
						teams: newTeams,
						matches: groupMatches,
						standings,
						played: false,
					};
				}),
			);
			setSwapSelection(null);
		},
		[swapSelection],
	);

	// 팀 승률 modifier 변경
	const changeModifier = useCallback((teamCode: string, delta: number) => {
		setTeamModifiers((prev) => {
			const next = new Map(prev);
			const cur = next.get(teamCode) ?? 0;
			const val = Math.max(-2, Math.min(2, cur + delta));
			if (val === 0) {
				next.delete(teamCode);
			} else {
				next.set(teamCode, val);
			}
			return next;
		});
	}, []);

	// 선발 XI 변경
	const changeXI = useCallback((teamCode: string, xi: Set<number>) => {
		setSelectedXI((prev) => {
			const next = new Map(prev);
			if (xi.size === 0) {
				next.delete(teamCode);
			} else {
				next.set(teamCode, xi);
			}
			return next;
		});
	}, []);

	// 팀 포메이션 변경
	const changeFormation = useCallback(
		(teamCode: string, formationId: string) => {
			setTeamFormations((prev) => {
				const next = new Map(prev);
				if (formationId === "4-4-2") {
					next.delete(teamCode);
				} else {
					next.set(teamCode, formationId);
				}
				return next;
			});
		},
		[],
	);

	// 조별 리그 개별 매치 진행 (순위 업데이트는 애니메이션 후 지연)
	const playGroupMatch = useCallback(
		(groupName: string, matchId: string) => {
			if (animatingMatchIds.has(matchId)) return;
			playWhistle();

			// 즉시: 매치 결과만 반영 (순위는 아직 업데이트 안 함)
			setGroups((prev) =>
				prev.map((g) => {
					if (g.name !== groupName) return g;
					const newMatches = g.matches.map((m) =>
						m.id === matchId && !m.played
							? simulateGroupMatch(m, teamModifiers, teamFormations, selectedXI)
							: m,
					);
					return { ...g, matches: newMatches };
				}),
			);
			setAnimatingMatchIds((prev) => new Set([...prev, matchId]));

			// 지연: 골 애니메이션이 끝난 후 순위 업데이트
			const timer = setTimeout(() => {
				setGroups((prev) =>
					prev.map((g) => {
						const standings = recalcStandings(g);
						const allDone = g.matches.every((m) => m.played);
						return { ...g, standings, played: allDone };
					}),
				);
				setAnimatingMatchIds((prev) => {
					const next = new Set(prev);
					next.delete(matchId);
					return next;
				});
				animTimers.current.delete(matchId);
			}, SCORE_ANIM_DELAY);
			animTimers.current.set(matchId, timer);
		},
		[animatingMatchIds, teamModifiers, teamFormations, selectedXI],
	);

	// 조별 리그 전체 진행
	const playAllGroupMatches = useCallback(() => {
		playClick();
		const simulated = groups.map((g) =>
			simulateGroup(g, teamModifiers, teamFormations, selectedXI),
		);
		setGroups(simulated);
	}, [groups, teamModifiers, teamFormations, selectedXI]);

	// 조별 리그 → 토너먼트 전환
	const advanceToKnockout = useCallback(() => {
		const advancers = getGroupAdvancers(groups, tournamentSize);
		const firstRoundName = roundOrder[0];
		const firstRound: RoundData = {
			name: firstRoundName,
			label: ROUND_LABELS[firstRoundName],
			matches: createMatches(advancers, firstRoundName),
		};
		setRounds([firstRound]);
		setCurrentRoundIndex(0);
		setPhase("knockout");
	}, [groups, tournamentSize, roundOrder]);

	// 토너먼트 개별 매치 진행 (현재 라운드 완료 시 자동으로 다음 라운드 생성)
	const playKnockoutMatch = useCallback(
		(matchId: string) => {
			if (currentRoundIndex < 0) return;
			playWhistle();
			const current = rounds[currentRoundIndex];
			const newMatches = current.matches.map((m) =>
				m.id === matchId && !m.played
					? simulateMatch(m, teamModifiers, teamFormations, selectedXI)
					: m,
			);
			const updatedRounds = [...rounds];
			updatedRounds[currentRoundIndex] = {
				...current,
				matches: newMatches,
			};

			const allDone = newMatches.every((m) => m.played);

			if (allDone && current.name === "final") {
				// 결승 완료 → 우승
				setRounds(updatedRounds);
				const winners = getWinners(newMatches);
				const finalMatch = newMatches[0];
				const opponent =
					finalMatch.winner?.code === finalMatch.team1.code
						? finalMatch.team2
						: finalMatch.team1;
				setChampion(winners[0]);
				recordWinner(winners[0], opponent);
				setPhase("finished");
				setTimeout(playVictory, 1500);
			} else if (allDone && current.name !== "final") {
				// 현재 라운드 완료 → 다음 라운드 자동 생성
				const winners = getWinners(newMatches);
				const nextIdx = roundOrder.indexOf(current.name) + 1;
				const nextRoundName = roundOrder[nextIdx];
				const nextRoundData: RoundData = {
					name: nextRoundName,
					label: ROUND_LABELS[nextRoundName],
					matches: createMatches(winners, nextRoundName),
				};
				updatedRounds.push(nextRoundData);
				setRounds(updatedRounds);
				setCurrentRoundIndex(currentRoundIndex + 1);
			} else {
				setRounds(updatedRounds);
			}
		},
		[
			rounds,
			currentRoundIndex,
			roundOrder,
			recordWinner,
			teamModifiers,
			teamFormations,
			selectedXI,
		],
	);

	// 토너먼트 현재 라운드 전체 진행 (완료 시 자동 다음 라운드 생성)
	const playAllCurrentRound = useCallback(() => {
		if (currentRoundIndex < 0 || champion) return;
		playClick();
		const current = rounds[currentRoundIndex];
		const simulatedMatches = simulateRound(
			current.matches,
			teamModifiers,
			teamFormations,
			selectedXI,
		);
		const updatedRounds = [...rounds];
		updatedRounds[currentRoundIndex] = {
			...current,
			matches: simulatedMatches,
		};

		const winners = getWinners(simulatedMatches);
		if (current.name === "final") {
			setRounds(updatedRounds);
			const finalMatch = simulatedMatches[0];
			const opponent =
				finalMatch.winner?.code === finalMatch.team1.code
					? finalMatch.team2
					: finalMatch.team1;
			setChampion(winners[0]);
			recordWinner(winners[0], opponent);
			setPhase("finished");
			setTimeout(playVictory, 1500);
		} else {
			// 자동으로 다음 라운드 생성
			const nextIdx = roundOrder.indexOf(current.name) + 1;
			const nextRoundName = roundOrder[nextIdx];
			const nextRoundData: RoundData = {
				name: nextRoundName,
				label: ROUND_LABELS[nextRoundName],
				matches: createMatches(winners, nextRoundName),
			};
			updatedRounds.push(nextRoundData);
			setRounds(updatedRounds);
			setCurrentRoundIndex(currentRoundIndex + 1);
		}
	}, [
		rounds,
		currentRoundIndex,
		champion,
		roundOrder,
		recordWinner,
		teamModifiers,
		teamFormations,
		selectedXI,
	]);

	// 새 대회
	const resetTournament = useCallback(() => {
		for (const t of animTimers.current.values()) clearTimeout(t);
		animTimers.current.clear();
		setAnimatingMatchIds(new Set());
		setTeamModifiers(new Map());
		setTeamFormations(new Map());
		setSelectedXI(new Map());
		setSquadModal(null);
		setSelectedTeams(selectTeams(tournamentSize));
		setGroups([]);
		setRounds([]);
		setCurrentRoundIndex(-1);
		setChampion(null);
		setPhase("select");
	}, [tournamentSize]);

	const firstKnockoutLabel = ROUND_LABELS[roundOrder[0]];

	return (
		<div className="app">
			<div className="top-panels">
				<button
					type="button"
					className="theme-toggle"
					onClick={toggleTheme}
					title={theme === "dark" ? "라이트 모드" : "다크 모드"}
					aria-label={
						theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환"
					}
				>
					{theme === "dark" ? "☀️" : "🌙"}
				</button>
				<button
					type="button"
					className={`sound-toggle ${soundOn ? "on" : "off"}`}
					onClick={toggleSound}
					title={soundOn ? "사운드 끄기" : "사운드 켜기"}
					aria-label={soundOn ? "사운드 끄기" : "사운드 켜기"}
				>
					{soundOn ? "🔊" : "🔇"}
				</button>
				<a
					href="https://ysoftman.github.io/dadjoke/"
					className="dadjoke-link"
					title="아재개그"
					aria-label="아재개그"
				>
					😂
				</a>
				<FifaRanking />
				<WinnerHistory />
			</div>
			<header className="header">
				<h1 className="title">
					<span className="title-author">윤준영의</span>
					<span className="title-main">
						<span className="title-fifa">FIFA</span>{" "}
						<span className="title-worldcup">World Cup</span>
					</span>
				</h1>
				<p className="update-date">FIFA 랭킹 데이터: 2026년 4월 기준</p>
			</header>

			{phase !== "select" && (
				<div className="phase-indicator">
					{(["select", "group", "knockout", "finished"] as Phase[]).map(
						(p, i) => (
							<div
								key={p}
								className={`phase-step ${p === phase ? "active" : ""} ${
									(
										["select", "group", "knockout", "finished"] as Phase[]
									).indexOf(phase) > i
										? "done"
										: ""
								}`}
							>
								<span className="phase-dot" />
								<span className="phase-label">
									{p === "select"
										? "선택"
										: p === "group"
											? "조별리그"
											: p === "knockout"
												? "토너먼트"
												: "완료"}
								</span>
							</div>
						),
					)}
				</div>
			)}

			{/* 대회 규모 선택 + 프리셋 */}
			{phase === "select" && (
				<div className="size-selector">
					<button
						type="button"
						className={`btn btn-size ${tournamentSize === 32 ? "active" : ""}`}
						onClick={() => changeTournamentSize(32)}
					>
						32강 (8조)
					</button>
					<button
						type="button"
						className={`btn btn-size ${tournamentSize === 48 ? "active" : ""}`}
						onClick={() => changeTournamentSize(48)}
					>
						48강 (12조)
					</button>
					{ALL_PRESETS.map((p) => (
						<button
							type="button"
							key={p.id}
							className="btn btn-preset"
							onClick={() => applyPreset(p)}
						>
							{p.label}
						</button>
					))}
				</div>
			)}

			<div className="controls">
				{phase === "select" && (
					<button
						type="button"
						className="btn btn-start"
						onClick={startTournament}
						disabled={selectedTeams.length !== tournamentSize}
					>
						대회 시작 ({selectedTeams.length}/{tournamentSize})
					</button>
				)}

				{phase === "group" && hasUnplayedGroupMatches && (
					<button
						type="button"
						className="btn btn-next"
						onClick={playAllGroupMatches}
						disabled={animatingMatchIds.size > 0}
					>
						조별 리그 전체 진행
					</button>
				)}

				{phase === "group" && groupAllDone && (
					<button
						type="button"
						className="btn btn-start"
						onClick={advanceToKnockout}
					>
						{firstKnockoutLabel} 진출
					</button>
				)}

				{phase === "knockout" &&
					currentRound &&
					currentRound.matches.some((m) => !m.played) && (
						<button
							type="button"
							className="btn btn-next"
							onClick={playAllCurrentRound}
						>
							{ROUND_LABELS[currentRound.name]} 전체 진행
						</button>
					)}

				{phase !== "select" && (
					<button
						type="button"
						className="btn btn-reset"
						onClick={resetTournament}
					>
						새 대회
					</button>
				)}
			</div>

			{phase === "select" && (
				<TeamSelector
					selectedTeams={selectedTeams}
					onUpdate={setSelectedTeams}
					maxTeams={tournamentSize}
				/>
			)}

			{phase === "finished" && champion && (
				<Champion team={champion} stats={teamStats.get(champion.code)} />
			)}

			{rounds.length > 0 && (
				<div>
					<h2 className="section-title">
						{presetLabel ? `${presetLabel} ` : ""}토너먼트
					</h2>
					<BracketView
						rounds={rounds}
						teamStats={teamStats}
						onPlayMatch={playKnockoutMatch}
						onOpenSquad={(team, readOnly) => setSquadModal({ team, readOnly })}
					/>
				</div>
			)}

			{groups.length > 0 && (
				<div className="groups-section">
					<h2 className="section-title">
						{presetLabel ? `${presetLabel} ` : ""}조별 리그
					</h2>
					{!groupAllDone &&
						(swapSelection ? (
							<p className="swap-hint">
								{swapSelection.team.flag} {swapSelection.team.nameKo} 선택됨
								&mdash; 다른 조의 팀을 클릭하면 교환됩니다
								<button
									type="button"
									className="btn-cancel-swap"
									onClick={() => setSwapSelection(null)}
								>
									취소
								</button>
							</p>
						) : (
							<p className="swap-hint-info">
								팀을 클릭하면 다른 조의 팀과 교환할 수 있습니다
							</p>
						))}
					<div className="groups-grid">
						{groups.map((group) => (
							<GroupView
								key={group.name}
								group={group}
								teamStats={teamStats}
								onPlayMatch={playGroupMatch}
								swapSelection={swapSelection}
								onSwapSelect={handleSwapSelect}
								teamModifiers={teamModifiers}
								onChangeModifier={changeModifier}
								teamFormations={teamFormations}
								onChangeFormation={changeFormation}
								wildcardCodes={wildcardCodes}
								animatingMatchIds={animatingMatchIds}
								onOpenSquad={(team, readOnly) =>
									setSquadModal({ team, readOnly })
								}
							/>
						))}
					</div>
				</div>
			)}
			{squadModal && (
				<SquadModal
					team={squadModal.team}
					formationId={teamFormations.get(squadModal.team.code) ?? "4-4-2"}
					selectedXI={selectedXI.get(squadModal.team.code) ?? new Set()}
					onChangeXI={changeXI}
					onClose={() => setSquadModal(null)}
					readOnly={squadModal.readOnly}
				/>
			)}
			<footer className="app-version">
				{__APP_VERSION__} · {__APP_COMMIT__} · {__APP_BUILD_TIME__}
			</footer>
		</div>
	);
}

export default App;
