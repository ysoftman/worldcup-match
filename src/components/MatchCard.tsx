import type { Match, TeamStats } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface MatchCardProps {
	match: Match;
	teamStats: Map<string, TeamStats>;
	onClick: () => void;
}

export function MatchCard({ match, teamStats, onClick }: MatchCardProps) {
	const { team1, team2, score1, score2, played, winner } = match;
	const stats1 = teamStats.get(team1.code);
	const stats2 = teamStats.get(team2.code);

	return (
		<button
			type="button"
			className={`match-card clickable ${played ? "played" : "pending"}`}
			onClick={onClick}
			disabled={played}
		>
			<div
				className={`team ${played && winner?.code === team1.code ? "winner" : ""}`}
			>
				<span className="flag">{team1.flag}</span>
				<span className="name">
					{team1.nameKo}
					<span className="name-en">({team1.name})</span>
				</span>
				{stats1 && <span className="winrate-badge">{stats1.winRate}%</span>}
				<AnimatedScore target={score1} active={played} className="score" />
			</div>
			<div className="vs">{played ? "-" : "vs"}</div>
			<div
				className={`team ${played && winner?.code === team2.code ? "winner" : ""}`}
			>
				<AnimatedScore target={score2} active={played} className="score" />
				{stats2 && <span className="winrate-badge">{stats2.winRate}%</span>}
				<span className="name">
					{team2.nameKo}
					<span className="name-en">({team2.name})</span>
				</span>
				<span className="flag">{team2.flag}</span>
			</div>
		</button>
	);
}
