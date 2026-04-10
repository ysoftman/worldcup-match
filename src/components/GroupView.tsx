import type { Country } from "../data/countries";
import type { Group, TeamStats } from "../types";
import { GroupMatchCard } from "./GroupMatchCard";

interface GroupViewProps {
	group: Group;
	teamStats: Map<string, TeamStats>;
	onPlayMatch: (groupName: string, matchId: string) => void;
	swapSelection: { groupName: string; team: Country } | null;
	onSwapSelect: (groupName: string, team: Country) => void;
}

export function GroupView({
	group,
	teamStats,
	onPlayMatch,
	swapSelection,
	onSwapSelect,
}: GroupViewProps) {
	const hasPlayedMatches = group.matches.some((m) => m.played);
	const canSwap = !hasPlayedMatches;

	return (
		<div className="group-card">
			<h3 className="group-name">{group.name}</h3>

			{/* 팀 목록 (경기 시작 전: 원형 배치, 클릭으로 교환 가능) */}
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
						const radius = 38;
						const x = 50 + radius * Math.cos(rad);
						const y = 50 + radius * Math.sin(rad);
						return (
							<button
								type="button"
								key={t.code}
								className={`circle-team ${isSelected ? "swap-selected" : ""} ${isSwapTarget ? "swap-target" : ""}`}
								style={{ left: `${x}%`, top: `${y}%` }}
								onClick={() => canSwap && onSwapSelect(group.name, t)}
							>
								<span className="circle-flag">{t.flag}</span>
								<span className="circle-name">{t.nameKo}</span>
							</button>
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
							return (
								<tr
									key={s.team.code}
									className={
										allDone ? (idx < 2 ? "qualified" : "eliminated") : ""
									}
								>
									<td className="rank">{idx + 1}</td>
									<td className="team-cell">
										<span className="flag-sm">{s.team.flag}</span>
										{s.team.nameKo}
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
					/>
				))}
			</div>
		</div>
	);
}
