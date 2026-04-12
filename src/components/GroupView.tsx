import type { Country } from "../data/countries";
import type { Group, TeamStats } from "../types";
import { DEFAULT_FORMATION_ID, FORMATIONS, getFormation } from "../types";
import { GroupMatchCard } from "./GroupMatchCard";

interface GroupViewProps {
	group: Group;
	teamStats: Map<string, TeamStats>;
	onPlayMatch: (groupName: string, matchId: string) => void;
	swapSelection: { groupName: string; team: Country } | null;
	onSwapSelect: (groupName: string, team: Country) => void;
	teamModifiers: Map<string, number>;
	onChangeModifier: (teamCode: string, delta: number) => void;
	teamFormations: Map<string, string>;
	onChangeFormation: (teamCode: string, formationId: string) => void;
	wildcardCodes: Set<string>;
	animatingMatchId: string | null;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}

const MOD_LABELS = ["🛡️🛡️", "🛡️", "", "🗡️", "🗡️🗡️"];

export function GroupView({
	group,
	teamStats,
	onPlayMatch,
	swapSelection,
	onSwapSelect,
	teamModifiers,
	onChangeModifier,
	teamFormations,
	onChangeFormation,
	wildcardCodes,
	animatingMatchId,
	onOpenSquad,
}: GroupViewProps) {
	const hasPlayedMatches = group.matches.some((m) => m.played);
	const canSwap = !hasPlayedMatches;

	return (
		<div className="group-card">
			<h3 className="group-name">{group.name}</h3>

			{/* 팀 목록 (경기 시작 전: 원형 배치, 클릭으로 교환 + 승률 조절) */}
			{!hasPlayedMatches && (
				<div className="group-circle">
					{group.teams.map((t, idx) => {
						const isSelected =
							swapSelection?.groupName === group.name &&
							swapSelection?.team.code === t.code;
						const isSwapTarget =
							swapSelection !== null && swapSelection.groupName !== group.name;
						const angle = (idx / group.teams.length) * 360 - 90;
						const rad = (angle * Math.PI) / 180;
						const radius = 35;
						const x = 50 + radius * Math.cos(rad);
						const y = 50 + radius * Math.sin(rad);
						const mod = teamModifiers.get(t.code) ?? 0;
						const formation =
							teamFormations.get(t.code) ?? DEFAULT_FORMATION_ID;
						return (
							<div
								key={t.code}
								className="circle-slot"
								style={{ left: `${x}%`, top: `${y}%` }}
							>
								<button
									type="button"
									className="squad-btn"
									onClick={(e) => {
										e.stopPropagation();
										onOpenSquad(t, false);
									}}
									title="스쿼드 보기"
									aria-label={`${t.nameKo} 스쿼드 보기`}
								>
									👥
								</button>
								<div className="circle-row">
									<button
										type="button"
										className="mod-btn"
										disabled={mod >= 2}
										onClick={(e) => {
											e.stopPropagation();
											onChangeModifier(t.code, 1);
										}}
										aria-label={`${t.nameKo} 공격력 증가`}
									>
										🗡️
									</button>
									<button
										type="button"
										className={`circle-team ${isSelected ? "swap-selected" : ""} ${isSwapTarget ? "swap-target" : ""}`}
										onClick={() => canSwap && onSwapSelect(group.name, t)}
									>
										<span className="circle-flag">{t.flag}</span>
										<span className="circle-name">{t.nameKo}</span>
										{mod !== 0 && (
											<span
												className={`mod-indicator ${mod > 0 ? "mod-up" : "mod-down"}`}
											>
												{MOD_LABELS[mod + 2]}
											</span>
										)}
									</button>
									<button
										type="button"
										className="mod-btn"
										disabled={mod <= -2}
										onClick={(e) => {
											e.stopPropagation();
											onChangeModifier(t.code, -1);
										}}
										aria-label={`${t.nameKo} 수비력 증가`}
									>
										🛡️
									</button>
								</div>
								<select
									className="formation-select"
									value={formation}
									onChange={(e) => {
										e.stopPropagation();
										onChangeFormation(t.code, e.target.value);
									}}
									onClick={(e) => e.stopPropagation()}
								>
									{FORMATIONS.map((f) => (
										<option key={f.id} value={f.id}>
											{f.label}
										</option>
									))}
								</select>
								{formation !== DEFAULT_FORMATION_ID &&
									(() => {
										const f = getFormation(formation);
										return (
											<div className="formation-stats">
												<span
													className={
														f.atkMod > 0
															? "stat-up"
															: f.atkMod < 0
																? "stat-down"
																: ""
													}
												>
													🗡️
													{f.atkMod > 0 ? "+" : ""}
													{f.atkMod}
												</span>
												<span
													className={
														f.defMod > 0
															? "stat-up"
															: f.defMod < 0
																? "stat-down"
																: ""
													}
												>
													🛡️
													{f.defMod > 0 ? "+" : ""}
													{f.defMod}
												</span>
											</div>
										);
									})()}
							</div>
						);
					})}
				</div>
			)}

			{/* 순위표 (경기가 하나라도 진행된 경우) */}
			{hasPlayedMatches && (
				<table className="standings-table">
					<thead>
						<tr>
							<th className="th-rank">#</th>
							<th className="th-team">팀</th>
							<th>경기</th>
							<th>승</th>
							<th>무</th>
							<th>패</th>
							<th>득</th>
							<th>실</th>
							<th>득실</th>
							<th>승점</th>
							<th className="th-winrate">승률</th>
						</tr>
					</thead>
					<tbody>
						{group.standings.map((s, idx) => {
							const stats = teamStats.get(s.team.code);
							const gd = s.goalsFor - s.goalsAgainst;
							const allDone = group.played;
							const mod = teamModifiers.get(s.team.code) ?? 0;
							const formation =
								teamFormations.get(s.team.code) ?? DEFAULT_FORMATION_ID;
							const isWildcard =
								allDone && idx === 2 && wildcardCodes.has(s.team.code);
							let rowClass = "";
							if (allDone) {
								if (idx < 2) rowClass = "qualified";
								else if (isWildcard) rowClass = "qualified-wildcard";
								else rowClass = "eliminated";
							}
							return (
								<tr key={s.team.code} className={rowClass}>
									<td className="rank">{idx + 1}</td>
									<td className="team-cell">
										<span className="flag-sm">{s.team.flag}</span>
										{s.team.nameKo}
										{isWildcard && <span className="wildcard-badge">WC</span>}
										{formation !== DEFAULT_FORMATION_ID && (
											<span className="formation-badge">{formation}</span>
										)}
										{mod !== 0 && (
											<span
												className={`mod-badge ${mod > 0 ? "mod-up" : "mod-down"}`}
											>
												{MOD_LABELS[mod + 2]}
											</span>
										)}
									</td>
									<td>{s.played}</td>
									<td>{s.wins}</td>
									<td>{s.draws}</td>
									<td>{s.losses}</td>
									<td>{s.goalsFor}</td>
									<td>{s.goalsAgainst}</td>
									<td
										className={gd > 0 ? "positive" : gd < 0 ? "negative" : ""}
									>
										{gd > 0 ? `+${gd}` : gd}
									</td>
									<td className="points">{s.points}</td>
									<td className="winrate">
										{stats ? `${stats.winRate}%` : "-"}
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			)}

			{/* 매치 목록 */}
			<div className="group-matches">
				{group.matches.map((m) => (
					<GroupMatchCard
						key={m.id}
						match={m}
						onClick={() => onPlayMatch(group.name, m.id)}
						teamModifiers={teamModifiers}
						teamFormations={teamFormations}
						isAnimating={animatingMatchId === m.id}
						onOpenSquad={onOpenSquad}
					/>
				))}
			</div>
		</div>
	);
}
