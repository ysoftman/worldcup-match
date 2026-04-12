import type { Country } from "../data/countries";
import type { Match, TeamStats } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface MatchCardProps {
	match: Match;
	teamStats: Map<string, TeamStats>;
	onClick: () => void;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}

export function MatchCard({
	match,
	teamStats,
	onClick,
	onOpenSquad,
}: MatchCardProps) {
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
				{/* biome-ignore lint/a11y/noStaticElementInteractions: 부모 button이 키보드 접근성 제공 */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: 부모 button이 키보드 접근성 제공 */}
				<span
					className={`flag${played ? " team-clickable" : ""}`}
					onClick={(e) => {
						if (!played) return;
						e.stopPropagation();
						onOpenSquad(team1, played);
					}}
				>
					{team1.flag}
				</span>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: 부모 button이 키보드 접근성 제공 */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: 부모 button이 키보드 접근성 제공 */}
				<span
					className={`name${played ? " team-clickable" : ""}`}
					onClick={(e) => {
						if (!played) return;
						e.stopPropagation();
						onOpenSquad(team1, played);
					}}
				>
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
				{/* biome-ignore lint/a11y/noStaticElementInteractions: 부모 button이 키보드 접근성 제공 */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: 부모 button이 키보드 접근성 제공 */}
				<span
					className={`name${played ? " team-clickable" : ""}`}
					onClick={(e) => {
						if (!played) return;
						e.stopPropagation();
						onOpenSquad(team2, played);
					}}
				>
					{team2.nameKo}
					<span className="name-en">({team2.name})</span>
				</span>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: 부모 button이 키보드 접근성 제공 */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: 부모 button이 키보드 접근성 제공 */}
				<span
					className={`flag${played ? " team-clickable" : ""}`}
					onClick={(e) => {
						if (!played) return;
						e.stopPropagation();
						onOpenSquad(team2, played);
					}}
				>
					{team2.flag}
				</span>
			</div>
		</button>
	);
}
