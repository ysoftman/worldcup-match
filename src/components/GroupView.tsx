import { Shield, Sword, UsersThree } from "@phosphor-icons/react";
import type { Country } from "../data/countries";
import { useI18n } from "../i18nContext";
import type { Group, TeamStats } from "../types";
import { DEFAULT_FORMATION_ID, FORMATIONS, getFormation } from "../types";
import { GroupMatchCard, ModMark } from "./GroupMatchCard";

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
	animatingMatchIds: Set<string>;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}

const signClass = (v: number) => (v > 0 ? "mod-up" : v < 0 ? "mod-down" : "");
const signed = (v: number) => (v > 0 ? `+${v}` : `${v}`);

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
	animatingMatchIds,
	onOpenSquad,
}: GroupViewProps) {
	const { t, tName, tGroup } = useI18n();
	const hasPlayedMatches = group.matches.some((m) => m.played);

	return (
		<div className="group-card panel">
			<h3 className="group-name">{tGroup(group.name)}</h3>

			{/* 팀 원형 배치 (경기 시작 전: 클릭으로 교환, 보정/포메이션 조절) */}
			{!hasPlayedMatches && (
				<div className="group-circle">
					{group.teams.map((team, idx) => {
						const isSelected =
							swapSelection?.groupName === group.name &&
							swapSelection?.team.code === team.code;
						const isSwapTarget =
							swapSelection !== null && swapSelection.groupName !== group.name;
						const angle = (idx / group.teams.length) * 360 - 90;
						const rad = (angle * Math.PI) / 180;
						const radius = 35;
						const x = 50 + radius * Math.cos(rad);
						const y = 50 + radius * Math.sin(rad);
						const mod = teamModifiers.get(team.code) ?? 0;
						const formationId =
							teamFormations.get(team.code) ?? DEFAULT_FORMATION_ID;
						const formation = getFormation(formationId);
						return (
							<div
								key={team.code}
								className="circle-slot"
								style={{ left: `${x}%`, top: `${y}%` }}
							>
								<button
									type="button"
									className="squad-btn"
									onClick={(e) => {
										e.stopPropagation();
										onOpenSquad(team, false);
									}}
									title={t("groupCircle.squadView")}
									aria-label={t("groupCircle.squadViewOf", {
										name: tName(team),
									})}
								>
									<UsersThree size={16} weight="bold" />
								</button>
								<div className="circle-row">
									<button
										type="button"
										className="mod-btn"
										disabled={mod >= 2}
										onClick={(e) => {
											e.stopPropagation();
											onChangeModifier(team.code, 1);
										}}
										title={t("groupCircle.atkUp")}
										aria-label={t("groupCircle.atkUpOf", { name: tName(team) })}
									>
										<Sword size={14} weight="bold" />
									</button>
									<button
										type="button"
										className={`circle-team${isSelected ? " swap-selected" : ""}${isSwapTarget ? " swap-target" : ""}`}
										onClick={() => onSwapSelect(group.name, team)}
									>
										<span className="circle-flag">{team.flag}</span>
										<span className="circle-name">{tName(team)}</span>
										<ModMark mod={mod} />
									</button>
									<button
										type="button"
										className="mod-btn"
										disabled={mod <= -2}
										onClick={(e) => {
											e.stopPropagation();
											onChangeModifier(team.code, -1);
										}}
										title={t("groupCircle.defUp")}
										aria-label={t("groupCircle.defUpOf", { name: tName(team) })}
									>
										<Shield size={14} weight="bold" />
									</button>
								</div>
								<select
									className="formation-select"
									value={formationId}
									onChange={(e) => {
										e.stopPropagation();
										onChangeFormation(team.code, e.target.value);
									}}
									onClick={(e) => e.stopPropagation()}
								>
									{FORMATIONS.map((f) => (
										<option key={f.id} value={f.id}>
											{f.label}
										</option>
									))}
								</select>
								{formationId !== DEFAULT_FORMATION_ID && (
									<div className="formation-stats">
										<span className={signClass(formation.atkMod)}>
											<Sword size={11} weight="bold" />
											{signed(formation.atkMod)}
										</span>
										<span className={signClass(formation.defMod)}>
											<Shield size={11} weight="bold" />
											{signed(formation.defMod)}
										</span>
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}

			{/* 순위표 (경기가 하나라도 진행된 경우) */}
			{hasPlayedMatches && (
				<div className="standings-scroll">
					<table className="standings-table">
						<thead>
							<tr>
								<th>#</th>
								<th className="th-team">{t("groupTable.team")}</th>
								<th>{t("groupTable.played")}</th>
								<th>{t("groupTable.wins")}</th>
								<th>{t("groupTable.draws")}</th>
								<th>{t("groupTable.losses")}</th>
								<th>{t("groupTable.goalsFor")}</th>
								<th>{t("groupTable.goalsAgainst")}</th>
								<th>{t("groupTable.goalDiff")}</th>
								<th>{t("groupTable.points")}</th>
								<th>{t("groupTable.winRate")}</th>
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
										<td className="num rank">{idx + 1}</td>
										<td className="team-cell">
											<span className="flag-sm">{s.team.flag}</span>
											{tName(s.team)}
											{isWildcard && (
												<span className="badge badge-accent">WC</span>
											)}
											{formation !== DEFAULT_FORMATION_ID && (
												<span className="badge">{formation}</span>
											)}
											{mod !== 0 && (
												<span className="badge">
													<ModMark mod={mod} />
												</span>
											)}
										</td>
										<td className="num">{s.played}</td>
										<td className="num">{s.wins}</td>
										<td className="num">{s.draws}</td>
										<td className="num">{s.losses}</td>
										<td className="num">{s.goalsFor}</td>
										<td className="num">{s.goalsAgainst}</td>
										<td className="num">{gd > 0 ? `+${gd}` : gd}</td>
										<td className="num points">{s.points}</td>
										<td className="num winrate">
											{stats ? `${stats.winRate}%` : "-"}
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
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
						isAnimating={animatingMatchIds.has(m.id)}
						onOpenSquad={onOpenSquad}
					/>
				))}
			</div>
		</div>
	);
}
