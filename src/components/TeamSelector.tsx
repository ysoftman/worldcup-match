import {
	MagnifyingGlass,
	SoccerBall,
	Target,
	Trophy,
} from "@phosphor-icons/react";
import { useState } from "react";
import type { Confederation, Country } from "../data/countries";
import { ALL_COUNTRIES } from "../data/countries";
import { useI18n } from "../i18nContext";
import type { TournamentSize } from "../types";
import { shuffle } from "../utils/tournament";

type RegionFilter = "all" | Confederation | "europe-africa" | "americas";

const REGION_FILTERS: { key: RegionFilter; tKey: string }[] = [
	{ key: "all", tKey: "selector.region.all" },
	{ key: "AFC", tKey: "selector.region.AFC" },
	{ key: "UEFA", tKey: "selector.region.UEFA" },
	{ key: "europe-africa", tKey: "selector.region.europe-africa" },
	{ key: "CAF", tKey: "selector.region.CAF" },
	{ key: "americas", tKey: "selector.region.americas" },
	{ key: "CONCACAF", tKey: "selector.region.CONCACAF" },
	{ key: "CONMEBOL", tKey: "selector.region.CONMEBOL" },
	{ key: "OFC", tKey: "selector.region.OFC" },
];

const SIZES: TournamentSize[] = [32, 48, 64];

function filterByRegion(countries: Country[], region: RegionFilter): Country[] {
	if (region === "all") return countries;
	if (region === "europe-africa")
		return countries.filter((c) => c.conf === "UEFA" || c.conf === "CAF");
	if (region === "americas")
		return countries.filter(
			(c) => c.conf === "CONCACAF" || c.conf === "CONMEBOL",
		);
	return countries.filter((c) => c.conf === region);
}

interface TeamSelectorProps {
	selectedTeams: Country[];
	onUpdate: (teams: Country[]) => void;
	maxTeams: number;
	tournamentSize: TournamentSize;
	onChangeTournamentSize: (size: TournamentSize) => void;
	onStart: () => void;
	onStartBall: () => void;
	onStartPenalty: () => void;
}

export function TeamSelector({
	selectedTeams,
	onUpdate,
	maxTeams,
	tournamentSize,
	onChangeTournamentSize,
	onStart,
	onStartBall,
	onStartPenalty,
}: TeamSelectorProps) {
	const { t, tName } = useI18n();
	const [search, setSearch] = useState("");
	const selectedCodes = new Set(selectedTeams.map((t) => t.code));
	const full = selectedTeams.length >= maxTeams;
	const ready = selectedTeams.length === maxTeams;

	const toggle = (country: Country) => {
		if (selectedCodes.has(country.code)) {
			onUpdate(selectedTeams.filter((t) => t.code !== country.code));
		} else if (!full) {
			onUpdate([...selectedTeams, country]);
		}
	};

	const shuffleFromRegion = (region: RegionFilter) => {
		const pool = filterByRegion(ALL_COUNTRIES, region);
		onUpdate(shuffle(pool).slice(0, maxTeams));
	};

	return (
		<section className="team-selector">
			<div className="size-seg">
				{SIZES.map((size) => (
					<button
						type="button"
						key={size}
						className="btn"
						aria-pressed={tournamentSize === size}
						onClick={() => onChangeTournamentSize(size)}
					>
						{t(`size.${size}`)}
					</button>
				))}
			</div>

			<h2 className="section-title">
				{t("selector.title")}{" "}
				<span className="num selector-count">
					({selectedTeams.length}/{maxTeams})
				</span>
			</h2>

			<div className="selector-actions">
				<button
					type="button"
					className="btn btn-primary btn-lg"
					onClick={onStart}
					disabled={!ready}
				>
					<Trophy size={18} weight="bold" />
					{t("btn.start")}
				</button>
				<button
					type="button"
					className="btn"
					onClick={onStartBall}
					disabled={!ready}
				>
					<SoccerBall size={18} weight="bold" />
					{t("btn.startBall")}
				</button>
				<button type="button" className="btn" onClick={onStartPenalty}>
					<Target size={18} weight="bold" />
					{t("btn.startPenalty")}
				</button>
			</div>

			<div className="region-filters">
				{REGION_FILTERS.map((r) => (
					<button
						type="button"
						key={r.key}
						className="btn btn-ghost btn-sm"
						onClick={() => shuffleFromRegion(r.key)}
					>
						{t("selector.regionRandom", { region: t(r.tKey) })}
					</button>
				))}
			</div>

			<div className="country-search-wrap">
				<MagnifyingGlass size={18} weight="bold" aria-hidden="true" />
				<input
					type="search"
					className="country-search"
					placeholder={t("selector.searchPlaceholder")}
					aria-label={t("selector.searchPlaceholder")}
					value={search}
					onChange={(e) => setSearch(e.target.value)}
				/>
			</div>

			<div className="country-grid">
				{[...ALL_COUNTRIES]
					.sort((a, b) => a.rank - b.rank)
					.filter((c) => {
						if (!search.trim()) return true;
						const q = search.trim().toLowerCase();
						return (
							c.nameKo.includes(q) ||
							c.name.toLowerCase().includes(q) ||
							c.code.toLowerCase().includes(q)
						);
					})
					.map((country) => {
						const selected = selectedCodes.has(country.code);
						return (
							<button
								type="button"
								key={country.code}
								className={`chip ${selected ? "is-selected" : ""}`}
								onClick={() => toggle(country)}
								disabled={!selected && full}
							>
								<span>{country.flag}</span>
								<span>
									{tName(country)}
									{tName(country) !== country.name ? `(${country.name})` : ""}
								</span>
							</button>
						);
					})}
			</div>
		</section>
	);
}
