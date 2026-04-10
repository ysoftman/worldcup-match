import type { Country } from "../data/countries";
import { ALL_COUNTRIES } from "../data/countries";

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

	const shuffleTeams = () => {
		const shuffled = [...ALL_COUNTRIES]
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
				<button
					type="button"
					className="btn btn-shuffle"
					onClick={shuffleTeams}
				>
					랜덤 선택
				</button>
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
