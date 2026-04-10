import type { Match, TeamStats } from "../types";
import { MatchCard } from "./MatchCard";

interface RoundViewProps {
	name: string;
	matches: Match[];
	teamStats: Map<string, TeamStats>;
	onPlayMatch: (matchId: string) => void;
}

export function RoundView({
	name,
	matches,
	teamStats,
	onPlayMatch,
}: RoundViewProps) {
	return (
		<div className="round">
			<h2 className="round-title">{name}</h2>
			<div className="matches-grid">
				{matches.map((match) => (
					<MatchCard
						key={match.id}
						match={match}
						teamStats={teamStats}
						onClick={() => onPlayMatch(match.id)}
					/>
				))}
			</div>
		</div>
	);
}
