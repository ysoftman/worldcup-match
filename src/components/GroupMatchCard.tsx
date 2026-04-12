import type { Country } from "../data/countries";
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
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}

export function GroupMatchCard({
	match,
	onClick,
	teamModifiers,
	teamFormations,
	isAnimating,
	onOpenSquad,
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
		// biome-ignore lint/a11y/noStaticElementInteractions: 경기 카드 클릭으로 시뮬레이션 실행
		// biome-ignore lint/a11y/useKeyWithClickEvents: 경기 카드 클릭으로 시뮬레이션 실행
		<div
			className={`match-card clickable ${played ? "played" : "pending"} ${isAnimating ? "laser-active" : ""}`}
			onClick={played ? undefined : onClick}
		>
			<div
				className={`team ${played ? (team1Win ? "winner" : isDraw ? "draw" : "loser") : ""}`}
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
				{played && (
					<span
						className={`result-icon ${team1Win ? "win" : isDraw ? "draw" : "lose"}`}
					>
						{team1Win ? "✓" : isDraw ? "−" : "✗"}
					</span>
				)}
			</div>
			<div className="vs">{played ? (isDraw ? "무" : "-") : "vs"}</div>
			<div
				className={`team ${played ? (team2Win ? "winner" : isDraw ? "draw" : "loser") : ""}`}
			>
				{played && (
					<span
						className={`result-icon ${team2Win ? "win" : isDraw ? "draw" : "lose"}`}
					>
						{team2Win ? "✓" : isDraw ? "−" : "✗"}
					</span>
				)}
				<AnimatedScore target={score2} active={played} className="score" />
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
		</div>
	);
}
