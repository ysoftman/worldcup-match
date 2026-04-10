import type { Country } from "./countries";
import { ALL_COUNTRIES } from "./countries";

function find(code: string): Country {
	const c = ALL_COUNTRIES.find((x) => x.code === code);
	if (!c) throw new Error(`국가 코드 ${code}를 찾을 수 없습니다`);
	return c;
}

export interface PresetGroup {
	name: string;
	teams: [Country, Country, Country, Country];
}

export interface Preset {
	id: string;
	label: string;
	size: 32 | 48;
	groups: PresetGroup[];
}

/** 2026 북중미 월드컵 (48팀, 12조) */
export const PRESET_2026: Preset = {
	id: "2026",
	label: "2026 북중미 월드컵",
	size: 48,
	groups: [
		{ name: "A조", teams: [find("MX"), find("ZA"), find("KR"), find("CZ")] },
		{ name: "B조", teams: [find("CA"), find("BA"), find("QA"), find("CH")] },
		{
			name: "C조",
			teams: [find("BR"), find("MA"), find("HT"), find("GB-SCT")],
		},
		{ name: "D조", teams: [find("US"), find("PY"), find("AU"), find("TR")] },
		{ name: "E조", teams: [find("DE"), find("CW"), find("CI"), find("EC")] },
		{ name: "F조", teams: [find("NL"), find("JP"), find("SE"), find("TN")] },
		{ name: "G조", teams: [find("BE"), find("EG"), find("IR"), find("NZ")] },
		{ name: "H조", teams: [find("ES"), find("CV"), find("SA"), find("UY")] },
		{ name: "I조", teams: [find("FR"), find("SN"), find("IQ"), find("NO")] },
		{ name: "J조", teams: [find("AR"), find("DZ"), find("AT"), find("JO")] },
		{ name: "K조", teams: [find("PT"), find("CD"), find("UZ"), find("CO")] },
		{
			name: "L조",
			teams: [find("GB-ENG"), find("HR"), find("GH"), find("PA")],
		},
	],
};

export const ALL_PRESETS: Preset[] = [PRESET_2026];
