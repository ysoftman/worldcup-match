/**
 * API-Football에서 월드컵 참가국 스쿼드를 가져오는 스크립트
 * 결과: src/data/playersWorldcup.json
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
	console.error("❌ API_FOOTBALL_KEY 환경변수 필요");
	process.exit(1);
}

const BASE_URL = "https://v3.football.api-sports.io";
const HEADERS: Record<string, string> = { "x-apisports-key": API_KEY };
const CACHE_PATH = resolve(import.meta.dir, ".cache_wc.json");
const OUTPUT_DIR = resolve(import.meta.dir, "../src/data/players");
const RATE_DELAY = 7000;

// 월드컵 참가국 (2026 + 역대 대회 주요국 포함)
const WC_COUNTRIES: Record<string, string> = {
	MX: "Mexico", ZA: "South Africa", KR: "Korea Republic", CZ: "Czech Republic",
	CA: "Canada", BA: "Bosnia", QA: "Qatar", CH: "Switzerland",
	BR: "Brazil", MA: "Morocco", HT: "Haiti", "GB-SCT": "Scotland",
	US: "USA", PY: "Paraguay", AU: "Australia", TR: "Turkey",
	DE: "Germany", CW: "Curacao", CI: "Ivory Coast", EC: "Ecuador",
	NL: "Netherlands", JP: "Japan", SE: "Sweden", TN: "Tunisia",
	BE: "Belgium", EG: "Egypt", IR: "Iran", NZ: "New Zealand",
	ES: "Spain", CV: "Cape Verde", SA: "Saudi Arabia", UY: "Uruguay",
	FR: "France", SN: "Senegal", IQ: "Iraq", NO: "Norway",
	AR: "Argentina", DZ: "Algeria", AT: "Austria", JO: "Jordan",
	PT: "Portugal", CD: "DR Congo", UZ: "Uzbekistan", CO: "Colombia",
	"GB-ENG": "England", HR: "Croatia", GH: "Ghana", PA: "Panama",
	// 역대 월드컵 주요 참가국
	IT: "Italy", PL: "Poland", DK: "Denmark", RS: "Serbia",
	RU: "Russia", PE: "Peru", CM: "Cameroon", NG: "Nigeria",
	CL: "Chile", CR: "Costa Rica", RO: "Romania", GR: "Greece",
	"GB-WLS": "Wales", IS: "Iceland", HN: "Honduras",
};

interface ApiPlayer {
	id: number;
	name: string;
	age: number;
	number: number | null;
	position: string;
	photo: string;
}
type Cache = Record<string, { teamId: number | null; players: ApiPlayer[]; fetchedAt: string }>;

function loadCache(): Cache {
	if (existsSync(CACHE_PATH)) return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
	return {};
}
function saveCache(cache: Cache) {
	writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
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

async function main() {
	const cache = loadCache();
	const codes = Object.keys(WC_COUNTRIES);
	const remaining = codes.filter((c) => !cache[c]);

	console.log(`📋 총 ${codes.length}개국, 캐시 ${Object.keys(cache).length}개, 남은 ${remaining.length}개`);

	// 남은 요청 수 확인
	const status = (await apiFetch("/status")) as {
		response: { requests: { current: number; limit_day: number } };
	};
	const used = status.response.requests.current;
	const limit = status.response.requests.limit_day;
	console.log(`📊 오늘 API 사용량: ${used}/${limit}`);

	let reqCount = used;

	for (const code of remaining) {
		if (reqCount + 2 > limit) {
			console.log(`\n⏸️  일일 한도 근접 (${reqCount}/${limit}). 내일 다시 실행하세요.`);
			break;
		}

		const name = WC_COUNTRIES[code];
		try {
			console.log(`🔍 ${name} (${code}): 팀 ID 조회...`);
			const teamId = await getNationalTeamId(name);
			reqCount++;
			await new Promise((r) => setTimeout(r, RATE_DELAY));

			if (!teamId) {
				console.log(`   ❌ 팀 없음 → fallback`);
				cache[code] = { teamId: null, players: [], fetchedAt: new Date().toISOString() };
				saveCache(cache);
				continue;
			}

			console.log(`   👥 팀 ID ${teamId}: 스쿼드 조회...`);
			const players = await getSquad(teamId);
			reqCount++;
			await new Promise((r) => setTimeout(r, RATE_DELAY));

			console.log(`   ✅ ${players.length}명`);
			cache[code] = { teamId, players, fetchedAt: new Date().toISOString() };
			saveCache(cache);
		} catch (err) {
			const msg = (err as Error).message;
			console.error(`   ❌ ${msg}`);
			if (msg.includes("rate") || msg.includes("Rate")) {
				console.log("   ⏳ Rate limit 대기 60초...");
				await new Promise((r) => setTimeout(r, 60000));
			}
		}
	}

	// 나라별 파일로 저장
	if (!existsSync(OUTPUT_DIR)) {
		const { mkdirSync } = await import("node:fs");
		mkdirSync(OUTPUT_DIR, { recursive: true });
	}
	let saved = 0;
	for (const [code, entry] of Object.entries(cache)) {
		if (entry.players.length > 0) {
			const players = entry.players.map((p) => ({
				id: p.id, name: p.name, position: p.position,
				age: p.age, number: p.number ?? 0, photo: p.photo,
			}));
			const filePath = resolve(OUTPUT_DIR, `${code.toLowerCase()}.json`);
			writeFileSync(filePath, JSON.stringify(players, null, 2));
			saved++;
		}
	}
	console.log(`\n✅ ${saved}개국 → ${OUTPUT_DIR}/`);
	console.log(`📊 API 사용: ${reqCount}/${limit}`);
	console.log("⚠️  새 국가 추가 시 src/data/players/index.ts 에 import 추가 필요");
}

main().catch(console.error);
