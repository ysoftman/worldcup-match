import type { Confederation, Country } from "../data/countries";
import { ALL_COUNTRIES } from "../data/countries";

type RegionFilter = "all" | Confederation | "europe-africa" | "americas";

const REGION_FILTERS: { key: RegionFilter; label: string }[] = [
	{ key: "all", label: "전세계" },
	{ key: "AFC", label: "아시아" },
	{ key: "UEFA", label: "유럽" },
	{ key: "europe-africa", label: "유럽+아프리카" },
	{ key: "CAF", label: "아프리카" },
	{ key: "americas", label: "아메리카" },
	{ key: "CONCACAF", label: "북중미" },
	{ key: "CONMEBOL", label: "남미" },
	{ key: "OFC", label: "오세아니아" },
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
		const shuffled = [...pool]
			.sort(() => Math.random() - 0.5)
			.slice(0, maxTeams);
		onUpdate(shuffled);
	};

	return (
		<div className="team-selector">
			<div className="selector-header">
				<h2>
					참가국 선택 ({selectedTeams.length}/{maxTeams})
				</h2>
				<div className="region-filters">
					{REGION_FILTERS.map((r) => (
						<button
							type="button"
							key={r.key}
							className="btn btn-shuffle"
							onClick={() => shuffleFromRegion(r.key)}
						>
							{r.label} 랜덤
						</button>
					))}
				</div>
			</div>
			<div className="country-grid">
				{[...ALL_COUNTRIES]
					.sort((a, b) => a.rank - b.rank)
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
								{country.nameKo}({country.name})
							</span>
						</button>
					))}
			</div>
		</div>
	);
}
