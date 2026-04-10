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

/** 2014 브라질 월드컵 (32팀, 8조) */
export const PRESET_2014: Preset = {
	id: "2014",
	label: "2014 브라질 월드컵",
	size: 32,
	groups: [
		{ name: "A조", teams: [find("BR"), find("HR"), find("MX"), find("CM")] },
		{ name: "B조", teams: [find("ES"), find("NL"), find("CL"), find("AU")] },
		{ name: "C조", teams: [find("CO"), find("GR"), find("CI"), find("JP")] },
		{
			name: "D조",
			teams: [find("UY"), find("CR"), find("GB-ENG"), find("IT")],
		},
		{ name: "E조", teams: [find("CH"), find("EC"), find("FR"), find("HN")] },
		{ name: "F조", teams: [find("AR"), find("BA"), find("IR"), find("NG")] },
		{ name: "G조", teams: [find("DE"), find("PT"), find("GH"), find("US")] },
		{ name: "H조", teams: [find("BE"), find("DZ"), find("RU"), find("KR")] },
	],
};

/** 2010 남아공 월드컵 (32팀, 8조) */
export const PRESET_2010: Preset = {
	id: "2010",
	label: "2010 남아공 월드컵",
	size: 32,
	groups: [
		{ name: "A조", teams: [find("ZA"), find("MX"), find("UY"), find("FR")] },
		{ name: "B조", teams: [find("AR"), find("NG"), find("KR"), find("GR")] },
		{
			name: "C조",
			teams: [find("GB-ENG"), find("US"), find("DZ"), find("SI")],
		},
		{ name: "D조", teams: [find("DE"), find("AU"), find("RS"), find("GH")] },
		{ name: "E조", teams: [find("NL"), find("DK"), find("JP"), find("CM")] },
		{ name: "F조", teams: [find("IT"), find("PY"), find("NZ"), find("SK")] },
		{ name: "G조", teams: [find("BR"), find("KP"), find("CI"), find("PT")] },
		{ name: "H조", teams: [find("ES"), find("CH"), find("HN"), find("CL")] },
	],
};

/** 2006 독일 월드컵 (32팀, 8조) */
export const PRESET_2006: Preset = {
	id: "2006",
	label: "2006 독일 월드컵",
	size: 32,
	groups: [
		{ name: "A조", teams: [find("DE"), find("CR"), find("PL"), find("EC")] },
		{
			name: "B조",
			teams: [find("GB-ENG"), find("PY"), find("TT"), find("SE")],
		},
		{ name: "C조", teams: [find("AR"), find("CI"), find("RS"), find("NL")] },
		{ name: "D조", teams: [find("MX"), find("IR"), find("AO"), find("PT")] },
		{ name: "E조", teams: [find("IT"), find("GH"), find("US"), find("CZ")] },
		{ name: "F조", teams: [find("BR"), find("HR"), find("AU"), find("JP")] },
		{ name: "G조", teams: [find("FR"), find("CH"), find("KR"), find("TG")] },
		{ name: "H조", teams: [find("ES"), find("UA"), find("TN"), find("SA")] },
	],
};

/** 2002 한일 월드컵 (32팀, 8조) */
export const PRESET_2002: Preset = {
	id: "2002",
	label: "2002 한일 월드컵",
	size: 32,
	groups: [
		{ name: "A조", teams: [find("FR"), find("SN"), find("UY"), find("DK")] },
		{ name: "B조", teams: [find("ES"), find("SI"), find("PY"), find("ZA")] },
		{ name: "C조", teams: [find("BR"), find("TR"), find("CN"), find("CR")] },
		{ name: "D조", teams: [find("KR"), find("PL"), find("US"), find("PT")] },
		{ name: "E조", teams: [find("DE"), find("SA"), find("IE"), find("CM")] },
		{
			name: "F조",
			teams: [find("AR"), find("NG"), find("GB-ENG"), find("SE")],
		},
		{ name: "G조", teams: [find("IT"), find("EC"), find("HR"), find("MX")] },
		{ name: "H조", teams: [find("JP"), find("BE"), find("RU"), find("TN")] },
	],
};

export const ALL_PRESETS: Preset[] = [
	PRESET_2026,
	PRESET_2022,
	PRESET_2018,
	PRESET_2014,
	PRESET_2010,
	PRESET_2006,
	PRESET_2002,
];
