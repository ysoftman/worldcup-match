/**
 * API-Football에서 FIFA 전체 국가 스쿼드를 가져오는 스크립트
 *
 * API-Football은 전체 national team ID를 한번에 조회하는 API가 없어서
 * 국가별로 /teams?country=X 를 호출해야 한다.
 * 조회된 team ID는 teamIds.json에 저장하여 이후 실행 시 재사용한다.
 *
 * 1) /countries 로 API 제공 국가 목록 조회
 * 2) countries.ts 의 212개국과 매칭
 * 3) teamIds.json에 없는 국가만 팀 ID 조회 후 저장
 * 4) 매칭된 국가의 national team squad 다운로드
 * 5) src/data/players/index.ts 자동 생성
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ALL_COUNTRIES } from "../src/data/countries";

const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
	console.error("❌ API_FOOTBALL_KEY 환경변수 필요 (.env 파일 또는 환경변수)");
	process.exit(1);
}

const BASE_URL = "https://v3.football.api-sports.io";
const HEADERS: Record<string, string> = { "x-apisports-key": API_KEY };
const TEAM_IDS_PATH = resolve(import.meta.dir, "teamIds.json");
const OUTPUT_DIR = resolve(import.meta.dir, "../src/data/players");
const INDEX_PATH = resolve(OUTPUT_DIR, "index.ts");
const RATE_DELAY = 7000;

// countries.ts name → API-Football name (자동 매칭 불가능한 경우만)
const NAME_OVERRIDES: Record<string, string> = {
	"UAE": "United-Arab-Emirates",
	"DR Congo": "Congo-DR",
	"North Macedonia": "Macedonia",
};

type TeamIdMap = Record<string, number | null>;

function loadTeamIds(): TeamIdMap {
	if (existsSync(TEAM_IDS_PATH)) return JSON.parse(readFileSync(TEAM_IDS_PATH, "utf-8"));
	return {};
}
function saveTeamIds(ids: TeamIdMap) {
	const sorted = Object.fromEntries(Object.entries(ids).sort(([a], [b]) => a.localeCompare(b)));
	writeFileSync(TEAM_IDS_PATH, `${JSON.stringify(sorted, null, "\t")}\n`);
}

interface ApiPlayer {
	id: number;
	name: string;
	age: number;
	number: number | null;
	position: string;
	photo: string;
}

async function apiFetch(endpoint: string): Promise<unknown> {
	const res = await fetch(`${BASE_URL}${endpoint}`, { headers: HEADERS });
	if (!res.ok) throw new Error(`HTTP ${res.status}`);
	const json = (await res.json()) as { errors?: Record<string, string> };
	if (json.errors && Object.keys(json.errors).length > 0) {
		throw new Error(Object.values(json.errors).join(", "));
	}
	return json;
}

async function getApiCountries(): Promise<Set<string>> {
	const data = (await apiFetch("/countries")) as {
		response: Array<{ name: string }>;
	};
	return new Set(data.response.map((c) => c.name));
}

function findApiName(projectName: string, apiNames: Set<string>): string | null {
	if (NAME_OVERRIDES[projectName]) {
		const override = NAME_OVERRIDES[projectName];
		return apiNames.has(override) ? override : null;
	}
	if (apiNames.has(projectName)) return projectName;
	const hyphenated = projectName.replace(/ /g, "-");
	if (apiNames.has(hyphenated)) return hyphenated;
	// case-insensitive fallback
	const lower = hyphenated.toLowerCase();
	for (const name of apiNames) {
		if (name.toLowerCase() === lower) return name;
	}
	return null;
}

async function getNationalTeamId(countryName: string): Promise<number | null> {
	const data = (await apiFetch(`/teams?country=${encodeURIComponent(countryName)}`)) as {
		response: Array<{ team: { id: number; national: boolean } }>;
	};
	return data.response?.find((t) => t.team.national)?.team.id ?? null;
}

async function getSquad(teamId: number): Promise<ApiPlayer[]> {
	const data = (await apiFetch(`/players/squads?team=${teamId}`)) as {
		response: Array<{ players: ApiPlayer[] }>;
	};
	return data.response?.[0]?.players ?? [];
}

// JS/TS 예약어와 충돌하는 국가 코드 처리
const RESERVED_WORDS = new Set(["do", "in", "is", "as", "if", "no"]);
function safeVarName(code: string): string {
	const base = code.toLowerCase().replace(/-/g, "_");
	return RESERVED_WORDS.has(base) ? `${base}_` : base;
}

function generateIndex() {
	const files = readdirSync(OUTPUT_DIR)
		.filter((f) => f.endsWith(".json"))
		.sort();

	const imports: string[] = [];
	const entries: string[] = [];

	imports.push('import type { RawPlayer } from "../../utils/playerRating";');

	for (const file of files) {
		const basename = file.replace(".json", "");
		const code = basename.toUpperCase().replace(/_/g, "-");
		const varName = safeVarName(basename);
		imports.push(`import ${varName} from "./${file}";`);
		const mapKey = code.includes("-") ? `"${code}"` : code;
		entries.push(`\t${mapKey}: ${varName},`);
	}

	const content = `${imports.join("\n")}\n\nconst playersMap: Record<string, RawPlayer[]> = {\n${entries.join("\n")}\n};\n\nexport default playersMap;\n`;
	writeFileSync(INDEX_PATH, content);
	console.log(`📝 index.ts 생성 (${files.length}개국)`);
}

async function fetchMissingTeamIds(
	targets: Array<{ code: string; name: string; apiName: string }>,
	teamIds: TeamIdMap,
	limit: number,
	startReqCount: number,
): Promise<number> {
	const missing = targets.filter((t) => !(t.code in teamIds));
	if (missing.length === 0) return startReqCount;

	console.log(`\n🔍 팀 ID 일괄 조회 시작 (${missing.length}개국)...`);
	let reqCount = startReqCount;

	for (const { code, name, apiName } of missing) {
		if (reqCount + 1 > limit) {
			console.log(`\n⏸️  일일 한도 근접 (${reqCount}/${limit}). 내일 다시 실행하세요.`);
			break;
		}
		try {
			const teamId = await getNationalTeamId(apiName);
			reqCount++;
			teamIds[code] = teamId;
			saveTeamIds(teamIds);
			console.log(`   ${name} (${code}): ${teamId ?? "팀 없음"}`);
			await new Promise((r) => setTimeout(r, RATE_DELAY));
		} catch (err) {
			const msg = (err as Error).message;
			console.error(`   ❌ ${name} (${code}): ${msg}`);
			if (msg.includes("rate") || msg.includes("Rate")) {
				console.log("   ⏳ Rate limit 대기 60초...");
				await new Promise((r) => setTimeout(r, 60000));
			}
		}
	}

	console.log(`✅ teamIds.json 저장 완료 (${Object.keys(teamIds).length}개국)\n`);
	return reqCount;
}

async function main() {
	const teamIds = loadTeamIds();

	// 1) API 제공 국가 목록 조회
	console.log("🌍 API 국가 목록 조회...");
	const apiNames = await getApiCountries();
	console.log(`   API 제공: ${apiNames.size}개국`);

	// 2) 프로젝트 212개국과 매칭
	const targets: Array<{ code: string; name: string; apiName: string }> = [];
	const noApi: string[] = [];

	for (const country of ALL_COUNTRIES) {
		const apiName = findApiName(country.name, apiNames);
		if (apiName) {
			targets.push({ code: country.code, name: country.name, apiName });
		} else {
			noApi.push(`${country.code}(${country.name})`);
			// API에 없는 국가도 null로 저장하여 다음 실행 시 재매칭 시도 방지
			if (!(country.code in teamIds)) {
				teamIds[country.code] = null;
			}
		}
	}
	// noApi 국가가 새로 추가되었으면 저장
	if (noApi.length > 0) saveTeamIds(teamIds);
	console.log(`   매칭: ${targets.length}개국, API 없음: ${noApi.length}개국`);

	// 남은 요청 수 확인
	const status = (await apiFetch("/status")) as {
		response: { requests: { current: number; limit_day: number } };
	};
	const used = status.response.requests.current;
	const limit = status.response.requests.limit_day;
	console.log(`📊 오늘 API 사용량: ${used}/${limit}`);

	let reqCount = used;

	// 3) teamIds.json에 없는 국가가 있으면 팀 ID 일괄 조회
	reqCount = await fetchMissingTeamIds(targets, teamIds, limit, reqCount);

	// 4) 이미 파일이 존재하는 국가는 건너뜀
	const remaining = targets.filter((t) => {
		const filePath = resolve(OUTPUT_DIR, `${t.code.toLowerCase()}.json`);
		return !existsSync(filePath);
	});

	console.log(`📋 총 ${targets.length}개국, teamId ${Object.keys(teamIds).length}개, 스쿼드 미저장 ${remaining.length}개`);

	if (remaining.length === 0) {
		console.log("✅ 모든 국가 다운로드 완료!");
		generateIndex();
		return;
	}

	if (!existsSync(OUTPUT_DIR)) {
		mkdirSync(OUTPUT_DIR, { recursive: true });
	}

	// 5) 스쿼드 다운로드 (teamId는 이미 확보됨)
	let saved = 0;

	for (const { code, name } of remaining) {
		const teamId = teamIds[code];
		if (!teamId) {
			console.log(`   ⏭️  ${name} (${code}): 팀 ID 없음 → skip`);
			continue;
		}

		if (reqCount + 1 > limit) {
			console.log(`\n⏸️  일일 한도 근접 (${reqCount}/${limit}). 내일 다시 실행하세요.`);
			break;
		}

		try {
			console.log(`   👥 ${name} (${code}) 팀 ID ${teamId}: 스쿼드 조회...`);
			const players = await getSquad(teamId);
			reqCount++;
			await new Promise((r) => setTimeout(r, RATE_DELAY));

			if (players.length > 0) {
				const mapped = players.map((p) => {
					const obj: Record<string, unknown> = {
						id: p.id, name: p.name, position: p.position,
						age: p.age ?? 0, number: p.number ?? 0,
					};
					if (p.photo) obj.photo = p.photo;
					return obj;
				});
				const filePath = resolve(OUTPUT_DIR, `${code.toLowerCase()}.json`);
				writeFileSync(filePath, JSON.stringify(mapped, null, 2));
				saved++;
				console.log(`   ✅ ${players.length}명 저장`);
			}
		} catch (err) {
			const msg = (err as Error).message;
			console.error(`   ❌ ${name} (${code}): ${msg}`);
			if (msg.includes("rate") || msg.includes("Rate")) {
				console.log("   ⏳ Rate limit 대기 60초...");
				await new Promise((r) => setTimeout(r, 60000));
			}
		}
	}

	console.log(`\n✅ ${saved}개국 저장 → ${OUTPUT_DIR}/`);
	console.log(`📊 API 사용: ${reqCount}/${limit}`);

	generateIndex();
}

main().catch(console.error);
