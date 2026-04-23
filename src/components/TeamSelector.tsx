import { useState } from "react";
import type { Confederation, Country } from "../data/countries";
import { ALL_COUNTRIES } from "../data/countries";
import { useI18n } from "../i18nContext";
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
}

export function TeamSelector({
	selectedTeams,
	onUpdate,
	maxTeams,
}: TeamSelectorProps) {
	const { t, tName } = useI18n();
	const [search, setSearch] = useState("");
	const selectedCodes = new Set(selectedTeams.map((t) => t.code));

	const toggle = (country: Country) => {
		if (selectedCodes.has(country.code)) {
			onUpdate(selectedTeams.filter((t) => t.code !== country.code));
		} else if (selectedTeams.length < maxTeams) {
			onUpdate([...selectedTeams, country]);
		}
	};

	const shuffleFromRegion = (region: RegionFilter) => {
		const pool = filterByRegion(ALL_COUNTRIES, region);
		const shuffled = shuffle(pool).slice(0, maxTeams);
		onUpdate(shuffled);
	};

	return (
		<div className="team-selector">
			<div className="selector-header">
				<h2>
					{t("selector.title")} ({selectedTeams.length}/{maxTeams})
				</h2>
				<div className="region-filters">
					{REGION_FILTERS.map((r) => (
						<button
							type="button"
							key={r.key}
							className="btn btn-shuffle"
							onClick={() => shuffleFromRegion(r.key)}
						>
							{t("selector.regionRandom", { region: t(r.tKey) })}
						</button>
					))}
				</div>
			</div>
			<input
				type="text"
				className="country-search"
				placeholder={t("selector.searchPlaceholder")}
				value={search}
				onChange={(e) => setSearch(e.target.value)}
			/>
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
					.map((country) => (
						<button
							type="button"
							key={country.code}
							className={`country-chip ${selectedCodes.has(country.code) ? "selected" : ""} ${
								!selectedCodes.has(country.code) &&
								selectedTeams.length >= maxTeams
									? "disabled"
									: ""
							}`}
							onClick={() => toggle(country)}
							disabled={
								!selectedCodes.has(country.code) &&
								selectedTeams.length >= maxTeams
							}
						>
							<span>{country.flag}</span>
							<span>
								{tName(country)}
								{tName(country) !== country.name ? `(${country.name})` : ""}
							</span>
						</button>
					))}
			</div>
		</div>
	);
}
