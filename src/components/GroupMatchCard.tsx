import { Shield, Sword } from "@phosphor-icons/react";
import type { MouseEvent } from "react";
import type { Country } from "../data/countries";
import { useI18n } from "../i18nContext";
import type { GroupMatch } from "../types";
import { DEFAULT_FORMATION_ID } from "../types";
import { AnimatedScore } from "./AnimatedScore";

/** 보정치 표시: 양수는 공격(칼), 음수는 수비(방패). 범위는 -2..2 */
export function ModMark({ mod }: { mod: number }) {
	if (mod === 0) return null;
	const Icon = mod > 0 ? Sword : Shield;
	return (
		<span className={`mod-mark ${mod > 0 ? "mod-up" : "mod-down"}`}>
			<Icon size={12} weight="bold" />
			{Math.abs(mod) > 1 && <Icon size={12} weight="bold" />}
		</span>
	);
}

interface GroupMatchCardProps {
	match: GroupMatch;
	onClick: () => void;
	teamModifiers: Map<string, number>;
	teamFormations: Map<string, string>;
	isAnimating: boolean;
	onOpenSquad: (team: Country, readOnly: boolean) => void;
}

type Result = "win" | "lose" | "draw" | "";

export function GroupMatchCard({
	match,
	onClick,
	teamModifiers,
	teamFormations,
	isAnimating,
	onOpenSquad,
}: GroupMatchCardProps) {
	const { t, tName, locale } = useI18n();
	const { team1, team2, score1, score2, played } = match;
	const isDraw = played && score1 === score2;
	const result = (own: number, other: number): Result => {
		if (!played) return "";
		if (own === other) return "draw";
		return own > other ? "win" : "lose";
	};
	const r1 = result(score1, score2);
	const r2 = result(score2, score1);

	const side = (team: Country, res: Result, away: boolean) => {
		const mod = teamModifiers.get(team.code) ?? 0;
		const formation = teamFormations.get(team.code) ?? DEFAULT_FORMATION_ID;
		const hasSettings = mod !== 0 || formation !== DEFAULT_FORMATION_ID;
		const openSquad = (e: MouseEvent) => {
			if (!played) return;
			e.stopPropagation();
			onOpenSquad(team, true);
		};
		const clickable = played ? " team-clickable" : "";
		return (
			<div className={`mr-team${away ? " mr-away" : ""} ${res}`}>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: 경기 후 국기 클릭으로 스쿼드 열기 */}
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: 경기 후 국기 클릭으로 스쿼드 열기 */}
				<span className={`mr-flag${clickable}`} onClick={openSquad}>
					{team.flag}
				</span>
				<span className="mr-label">
					{/* biome-ignore lint/a11y/noStaticElementInteractions: 경기 후 팀명 클릭으로 스쿼드 열기 */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: 경기 후 팀명 클릭으로 스쿼드 열기 */}
					<span className={`mr-name${clickable}`} onClick={openSquad}>
						{tName(team)}
						{locale === "ko" && (
							<span className="mr-name-en">({team.name})</span>
						)}
					</span>
					{hasSettings && (
						<span className="mr-tags">
							{formation !== DEFAULT_FORMATION_ID && (
								<span className="badge">{formation}</span>
							)}
							{mod !== 0 && (
								<span className="badge">
									<ModMark mod={mod} />
								</span>
							)}
						</span>
					)}
				</span>
			</div>
		);
	};

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: 경기 행 클릭으로 시뮬레이션 실행
		// biome-ignore lint/a11y/useKeyWithClickEvents: 경기 행 클릭으로 시뮬레이션 실행
		<div
			className={`match-row ${played ? "played" : "pending"}${isAnimating ? " is-live" : ""}`}
			onClick={played ? undefined : onClick}
		>
			{side(team1, r1, false)}
			<div className="mr-score">
				<AnimatedScore
					target={score1}
					active={played}
					className={`num mr-num ${r1}`}
				/>
				<span className="mr-sep">
					{played ? (
						isDraw ? (
							<span className="badge badge-draw">{t("match.draw")}</span>
						) : (
							"-"
						)
					) : (
						"vs"
					)}
				</span>
				<AnimatedScore
					target={score2}
					active={played}
					className={`num mr-num ${r2}`}
				/>
			</div>
			{side(team2, r2, true)}
		</div>
	);
}
