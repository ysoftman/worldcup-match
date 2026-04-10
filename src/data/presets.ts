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

/** 2022 카타르 월드컵 (32팀, 8조) */
export const PRESET_2022: Preset = {
	id: "2022",
	label: "2022 카타르 월드컵",
	size: 32,
	groups: [
		{ name: "A조", teams: [find("QA"), find("EC"), find("SN"), find("NL")] },
		{
			name: "B조",
			teams: [find("GB-ENG"), find("IR"), find("US"), find("GB-WLS")],
		},
		{ name: "C조", teams: [find("AR"), find("SA"), find("MX"), find("PL")] },
		{ name: "D조", teams: [find("FR"), find("AU"), find("DK"), find("TN")] },
		{ name: "E조", teams: [find("ES"), find("CR"), find("DE"), find("JP")] },
		{ name: "F조", teams: [find("BE"), find("CA"), find("MA"), find("HR")] },
		{ name: "G조", teams: [find("BR"), find("RS"), find("CH"), find("CM")] },
		{ name: "H조", teams: [find("PT"), find("GH"), find("UY"), find("KR")] },
	],
};

/** 2018 러시아 월드컵 (32팀, 8조) */
export const PRESET_2018: Preset = {
	id: "2018",
	label: "2018 러시아 월드컵",
	size: 32,
	groups: [
		{ name: "A조", teams: [find("RU"), find("SA"), find("EG"), find("UY")] },
		{ name: "B조", teams: [find("PT"), find("ES"), find("MA"), find("IR")] },
		{ name: "C조", teams: [find("FR"), find("AU"), find("PE"), find("DK")] },
		{ name: "D조", teams: [find("AR"), find("IS"), find("HR"), find("NG")] },
		{ name: "E조", teams: [find("BR"), find("CH"), find("CR"), find("RS")] },
		{ name: "F조", teams: [find("DE"), find("MX"), find("SE"), find("KR")] },
		{
			name: "G조",
			teams: [find("BE"), find("PA"), find("TN"), find("GB-ENG")],
		},
		{ name: "H조", teams: [find("PL"), find("SN"), find("CO"), find("JP")] },
	],
};

export const ALL_PRESETS: Preset[] = [PRESET_2026, PRESET_2022, PRESET_2018];
