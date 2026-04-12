import { Fragment } from "react";
import type { Country } from "../data/countries";
import type { Match, RoundName, TeamStats } from "../types";
import { ROUND_LABELS, ROUND_ORDER_32, ROUND_ORDER_48 } from "../types";
import { AnimatedScore } from "./AnimatedScore";

interface BracketRound {
	name: RoundName;
	label: string;
	matches: Match[];
}

interface BracketViewProps {
	rounds: BracketRound[];
	teamStats: Map<string, TeamStats>;
	onPlayMatch: (matchId: string) => void;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}

/* 대진표용 소형 매치 카드 */
function BracketMatchCard({
	match,
	teamStats,
	onClick,
	onOpenSquad,
}: {
	match: Match;
	teamStats: Map<string, TeamStats>;
	onClick: () => void;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}) {
	const { team1, team2, score1, score2, played, winner } = match;
	const s1 = teamStats.get(team1.code);
	const s2 = teamStats.get(team2.code);
	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 경기 카드 클릭으로 시뮬레이션 실행
		// biome-ignore lint/a11y/useKeyWithClickEvents: 경기 카드 클릭으로 시뮬레이션 실행
		<div
			className={`bm-card ${played ? "bm-played" : "bm-pending"}`}
			onClick={played ? undefined : onClick}
		>
			<div
				className={`bm-team ${played ? (winner?.code === team1.code ? "bm-win" : "bm-lose") : ""}`}
			>
				<span
					className={`bm-flag${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team1, true);
								},
							}
						: {})}
				>
					{team1.flag}
				</span>
				<span
					className={`bm-name${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team1, true);
								},
							}
						: {})}
				>
					{team1.nameKo}
				</span>
				{s1 && <span className="bm-rate">{s1.winRate}%</span>}
				<AnimatedScore target={score1} active={played} className="bm-score" />
				{played && (
					<span
						className={`result-icon ${winner?.code === team1.code ? "win" : "lose"}`}
					>
						{winner?.code === team1.code ? "✓" : "✗"}
					</span>
				)}
			</div>
			<div
				className={`bm-team ${played ? (winner?.code === team2.code ? "bm-win" : "bm-lose") : ""}`}
			>
				<span
					className={`bm-flag${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team2, true);
								},
							}
						: {})}
				>
					{team2.flag}
				</span>
				<span
					className={`bm-name${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team2, true);
								},
							}
						: {})}
				>
					{team2.nameKo}
				</span>
				{s2 && <span className="bm-rate">{s2.winRate}%</span>}
				<AnimatedScore target={score2} active={played} className="bm-score" />
				{played && (
					<span
						className={`result-icon ${winner?.code === team2.code ? "win" : "lose"}`}
					>
						{winner?.code === team2.code ? "✓" : "✗"}
					</span>
				)}
			</div>
		</div>
	);
}

function PlaceholderCard() {
	return (
		<div className="bm-card bm-placeholder">
			<div className="bm-team">
				<span className="bm-name">?</span>
				<span className="bm-score">-</span>
			</div>
			<div className="bm-team">
				<span className="bm-name">?</span>
				<span className="bm-score">-</span>
			</div>
		</div>
	);
}

/* 결승전 전용 카드 (원형 국기 좌우 대칭) */
function FinalMatchCard({
	match,
	teamStats,
	onClick,
	onOpenSquad,
}: {
	match: Match;
	teamStats: Map<string, TeamStats>;
	onClick: () => void;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}) {
	const { team1, team2, score1, score2, played, winner } = match;
	const s1 = teamStats.get(team1.code);
	const s2 = teamStats.get(team2.code);
	const t1Win = played && winner?.code === team1.code;
	const t2Win = played && winner?.code === team2.code;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 경기 카드 클릭으로 시뮬레이션 실행
		// biome-ignore lint/a11y/useKeyWithClickEvents: 경기 카드 클릭으로 시뮬레이션 실행
		<div
			className={`final-card ${played ? "final-played" : "final-pending"}`}
			onClick={played ? undefined : onClick}
		>
			<div
				className={`final-team ${played ? (t1Win ? "final-win" : "final-lose") : ""}`}
			>
				<div
					className={`final-circle${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team1, true);
								},
							}
						: {})}
				>
					<span className="final-flag">{team1.flag}</span>
				</div>
				<span
					className={`final-name${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team1, true);
								},
							}
						: {})}
				>
					{team1.nameKo}
				</span>
				<AnimatedScore
					target={score1}
					active={played}
					className="final-score"
				/>
				{s1 && <span className="final-rate">{s1.winRate}%</span>}
			</div>
			<div className="final-vs">{played ? "-" : "VS"}</div>
			<div
				className={`final-team ${played ? (t2Win ? "final-win" : "final-lose") : ""}`}
			>
				<div
					className={`final-circle${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team2, true);
								},
							}
						: {})}
				>
					<span className="final-flag">{team2.flag}</span>
				</div>
				<span
					className={`final-name${played ? " team-clickable" : ""}`}
					{...(played
						? {
								onClick: (e: React.MouseEvent) => {
									e.stopPropagation();
									onOpenSquad(team2, true);
								},
							}
						: {})}
				>
					{team2.nameKo}
				</span>
				<AnimatedScore
					target={score2}
					active={played}
					className="final-score"
				/>
				{s2 && <span className="final-rate">{s2.winRate}%</span>}
			</div>
		</div>
	);
}

function FinalPlaceholder() {
	return (
		<div className="final-card final-placeholder">
			<div className="final-team">
				<div className="final-circle">
					<span className="final-flag">?</span>
				</div>
				<span className="final-name">?</span>
				<span className="final-score">-</span>
			</div>
			<div className="final-vs">VS</div>
			<div className="final-team">
				<div className="final-circle">
					<span className="final-flag">?</span>
				</div>
				<span className="final-name">?</span>
				<span className="final-score">-</span>
			</div>
		</div>
	);
}

/* 라운드 컬럼 렌더링 */
function RoundColumn({
	round,
	teamStats,
	onPlayMatch,
	onOpenSquad,
}: {
	round: BracketRound | null;
	teamStats: Map<string, TeamStats>;
	onPlayMatch: (id: string) => void;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}) {
	if (!round) return null;
	return (
		<div className="b-round">
			<div className="b-label">{round.label}</div>
			<div className="b-slots">
				{round.matches.map((m) => (
					<div className="b-slot" key={m.id}>
						<BracketMatchCard
							match={m}
							teamStats={teamStats}
							onClick={() => onPlayMatch(m.id)}
							onOpenSquad={onOpenSquad}
						/>
					</div>
				))}
			</div>
		</div>
	);
}

/* 플레이스홀더 라운드 */
function PlaceholderColumn({ label, count }: { label: string; count: number }) {
	return (
		<div className="b-round">
			<div className="b-label">{label}</div>
			<div className="b-slots">
				{Array.from({ length: count }).map((_, i) => (
					<div
						className="b-slot"
						key={`ph-${label}-${
							// biome-ignore lint/suspicious/noArrayIndexKey: 고정 플레이스홀더
							i
						}`}
					>
						<PlaceholderCard />
					</div>
				))}
			</div>
		</div>
	);
}

/* 커넥터 컬럼 (매치 2개 → 1개 합류 라인) */
function ConnectorColumn({
	pairCount,
	side,
}: {
	pairCount: number;
	side: "left" | "right";
}) {
	return (
		<div className={`b-conn b-conn-${side}`}>
			{Array.from({ length: pairCount }).map((_, i) => (
				<div
					className="b-conn-pair"
					key={`c-${
						// biome-ignore lint/suspicious/noArrayIndexKey: 고정 커넥터
						i
					}`}
				>
					<div className="b-conn-top" />
					<div className="b-conn-bot" />
				</div>
			))}
		</div>
	);
}

export function BracketView({
	rounds,
	teamStats,
	onPlayMatch,
	onOpenSquad,
}: BracketViewProps) {
	// 결승 분리 + 좌/우 분할
	const leftRounds: (BracketRound | null)[] = [];
	const rightRounds: (BracketRound | null)[] = [];
	let finalRound: BracketRound | null = null;

	for (const round of rounds) {
		if (round.name === "final") {
			finalRound = round;
		} else {
			const half = round.matches.length / 2;
			leftRounds.push({
				...round,
				matches: round.matches.slice(0, half),
			});
			rightRounds.push({
				...round,
				matches: round.matches.slice(half),
			});
		}
	}

	// 예상 라운드 수에 맞춰 플레이스홀더 추가
	// 첫 라운드 매치 수 기반으로 전체 라운드 계산
	const firstLeftCount =
		leftRounds.length > 0 ? (leftRounds[0] as BracketRound).matches.length : 4;
	const expectedRounds = Math.log2(firstLeftCount) + 1; // R16(4)→3 rounds(R16,QF,SF)

	while (leftRounds.length < expectedRounds) {
		leftRounds.push(null);
	}
	while (rightRounds.length < expectedRounds) {
		rightRounds.push(null);
	}

	// 전체 라운드 순서에서 결승 제외한 라벨 (플레이스홀더용)
	const firstRoundName = rounds.length > 0 ? rounds[0].name : "round16";
	const fullOrder =
		firstRoundName === "round32" ? ROUND_ORDER_48 : ROUND_ORDER_32;
	const roundLabels = fullOrder
		.filter((r) => r !== "final")
		.map((r) => ROUND_LABELS[r]);

	// 우측 대진표는 뒤집어서 렌더 (4강→8강→16강 순으로 표시)
	const reversedRight = [...rightRounds].reverse();

	return (
		<div className="bracket-scroll">
			<div className="bracket">
				{/* 좌측 대진표 */}
				<div className="bracket-half bracket-left">
					{leftRounds.map((round, rIdx) => {
						const label = round
							? round.label
							: roundLabels[rIdx] || ROUND_LABELS.quarter;
						const matchCount = round
							? round.matches.length
							: firstLeftCount / 2 ** rIdx;

						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: 고정 라운드 순서
							<Fragment key={`l-${rIdx}`}>
								{round ? (
									<RoundColumn
										round={round}
										teamStats={teamStats}
										onPlayMatch={onPlayMatch}
										onOpenSquad={onOpenSquad}
									/>
								) : (
									<PlaceholderColumn label={label} count={matchCount} />
								)}
								{rIdx < leftRounds.length - 1 && (
									<ConnectorColumn
										pairCount={Math.max(1, matchCount / 2)}
										side="left"
									/>
								)}
							</Fragment>
						);
					})}
				</div>

				{/* 결승 연결선 (좌) */}
				<div className="b-final-line" />

				{/* 결승 */}
				<div className="bracket-center">
					<div className="b-label">{ROUND_LABELS.final}</div>
					{finalRound ? (
						<FinalMatchCard
							match={finalRound.matches[0]}
							teamStats={teamStats}
							onClick={() => onPlayMatch(finalRound.matches[0].id)}
							onOpenSquad={onOpenSquad}
						/>
					) : (
						<FinalPlaceholder />
					)}
				</div>

				{/* 결승 연결선 (우) */}
				<div className="b-final-line" />

				{/* 우측 대진표 */}
				<div className="bracket-half bracket-right">
					{reversedRight.map((round, rIdx) => {
						const origIdx = reversedRight.length - 1 - rIdx;
						const label = round
							? round.label
							: roundLabels[origIdx] || ROUND_LABELS.quarter;
						const matchCount = round
							? round.matches.length
							: firstLeftCount / 2 ** origIdx;
						// 커넥터: 이전 컬럼(중앙에 가까운 쪽) 매치 수 기준
						const prevMatchCount =
							rIdx > 0
								? (() => {
										const prev = reversedRight[rIdx - 1];
										if (prev) return prev.matches.length;
										const prevOrigIdx = reversedRight.length - rIdx;
										return firstLeftCount / 2 ** prevOrigIdx;
									})()
								: 0;

						return (
							// biome-ignore lint/suspicious/noArrayIndexKey: 고정 라운드 순서
							<Fragment key={`r-${rIdx}`}>
								{rIdx > 0 && (
									<ConnectorColumn pairCount={prevMatchCount} side="right" />
								)}
								{round ? (
									<RoundColumn
										round={round}
										teamStats={teamStats}
										onPlayMatch={onPlayMatch}
										onOpenSquad={onOpenSquad}
									/>
								) : (
									<PlaceholderColumn label={label} count={matchCount} />
								)}
							</Fragment>
						);
					})}
				</div>
			</div>
		</div>
	);
}
