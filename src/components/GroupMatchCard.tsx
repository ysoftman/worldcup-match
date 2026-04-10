import type { GroupMatch } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface GroupMatchCardProps {
	match: GroupMatch;
	onClick: () => void;
}

export function GroupMatchCard({ match, onClick }: GroupMatchCardProps) {
	const { team1, team2, score1, score2, played } = match;
	const isDraw = played && score1 === score2;
	const team1Win = played && score1 > score2;
	const team2Win = played && score2 > score1;

	return (
		<button
			type="button"
			className={`match-card clickable ${played ? "played" : "pending"}`}
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
				</span>
				<span className="flag">{team2.flag}</span>
			</div>
		</button>
	);
}
