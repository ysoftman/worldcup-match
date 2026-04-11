import type { GroupMatch } from "../types";
import { DEFAULT_FORMATION_ID } from "../types";
import { AnimatedScore } from "./AnimatedScore";

const MOD_LABELS = ["🛡️🛡️", "🛡️", "", "🗡️", "🗡️🗡️"];

interface GroupMatchCardProps {
	match: GroupMatch;
	onClick: () => void;
	teamModifiers: Map<string, number>;
	teamFormations: Map<string, string>;
	isAnimating: boolean;
}

export function GroupMatchCard({
	match,
	onClick,
	teamModifiers,
	teamFormations,
	isAnimating,
}: GroupMatchCardProps) {
	const { team1, team2, score1, score2, played } = match;
	const isDraw = played && score1 === score2;
	const team1Win = played && score1 > score2;
	const team2Win = played && score2 > score1;

	const mod1 = teamModifiers.get(team1.code) ?? 0;
	const mod2 = teamModifiers.get(team2.code) ?? 0;
	const f1 = teamFormations.get(team1.code) ?? DEFAULT_FORMATION_ID;
	const f2 = teamFormations.get(team2.code) ?? DEFAULT_FORMATION_ID;
	const hasSettings1 = mod1 !== 0 || f1 !== DEFAULT_FORMATION_ID;
	const hasSettings2 = mod2 !== 0 || f2 !== DEFAULT_FORMATION_ID;

	return (
		<button
			type="button"
			className={`match-card clickable ${played ? "played" : "pending"} ${isAnimating ? "laser-active" : ""}`}
			onClick={onClick}
			disabled={played}
		>
			<div
				className={`team ${played ? (team1Win ? "winner" : isDraw ? "draw" : "loser") : ""}`}
			>
				<span className="flag">{team1.flag}</span>
				<span className="name">
					{team1.nameKo}
					<span className="name-en">({team1.name})</span>
					{hasSettings1 && (
						<span className="match-team-settings">
							{f1 !== DEFAULT_FORMATION_ID && (
								<span className="match-formation">{f1}</span>
							)}
							{mod1 !== 0 && (
								<span
									className={`match-mod ${mod1 > 0 ? "mod-up" : "mod-down"}`}
								>
									{MOD_LABELS[mod1 + 2]}
								</span>
							)}
						</span>
					)}
				</span>
				<AnimatedScore target={score1} active={played} className="score" />
			</div>
			<div className="vs">{played ? (isDraw ? "무" : "-") : "vs"}</div>
			<div
				className={`team ${played ? (team2Win ? "winner" : isDraw ? "draw" : "loser") : ""}`}
			>
				<AnimatedScore target={score2} active={played} className="score" />
				<span className="name">
					{team2.nameKo}
					<span className="name-en">({team2.name})</span>
					{hasSettings2 && (
						<span className="match-team-settings">
							{f2 !== DEFAULT_FORMATION_ID && (
								<span className="match-formation">{f2}</span>
							)}
							{mod2 !== 0 && (
								<span
									className={`match-mod ${mod2 > 0 ? "mod-up" : "mod-down"}`}
								>
									{MOD_LABELS[mod2 + 2]}
								</span>
							)}
						</span>
					)}
				</span>
				<span className="flag">{team2.flag}</span>
			</div>
		</button>
	);
}
