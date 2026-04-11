/**
 * API-Football에서 국가대표 스쿼드를 가져오는 Bun 스크립트
 *
 * 사용법:
 *   API_FOOTBALL_KEY=your_rapidapi_key bun run scripts/fetchPlayers.ts
 *
 * 무료 tier: 100요청/일 → 하루 ~50개국 처리 (팀ID + 스쿼드 각 1회)
 * 캐시 파일로 진행 상황을 저장하므로, 다음 날 이어서 실행 가능
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
	console.error("❌ API_FOOTBALL_KEY 환경변수를 설정해주세요.");
	console.error("   API_FOOTBALL_KEY=your_key bun run scripts/fetchPlayers.ts");
	process.exit(1);
}

const BASE_URL = "https://api-football-v1.p.rapidapi.com/v3";
const HEADERS = {
	"X-RapidAPI-Host": "api-football-v1.p.rapidapi.com",
	"X-RapidAPI-Key": API_KEY,
};

const CACHE_PATH = resolve(import.meta.dir, ".cache.json");
const OUTPUT_PATH = resolve(import.meta.dir, "../src/data/players.json");

// 국가 이름 매핑 (countries.ts의 name → API-Football의 country name)
// API-Football은 대부분 동일하지만 일부 차이 존재
const COUNTRY_NAME_MAP: Record<string, string> = {
	"South Korea": "Korea Republic",
	"North Korea": "Korea DPR",
	"USA": "USA",
	"DR Congo": "DR Congo",
	"Ivory Coast": "Cote D Ivoire",
	"China PR": "China",
	"Chinese Taipei": "Chinese Taipei",
	"Türkiye": "Turkey",
};

interface CacheEntry {
	teamId: number | null;
	players: ApiPlayer[];
	fetchedAt: string;
}

interface ApiPlayer {
	id: number;
	name: string;
	age: number;
	number: number | null;
	position: string;
	photo: string;
}

type Cache = Record<string, CacheEntry>;

function loadCache(): Cache {
	if (existsSync(CACHE_PATH)) {
		return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
	}
	return {};
}

function saveCache(cache: Cache) {
	writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function apiFetch(endpoint: string): Promise<unknown> {
	const url = `${BASE_URL}${endpoint}`;
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) {
		throw new Error(`API error ${res.status}: ${res.statusText} for ${url}`);
	}
	return res.json();
}

// 국가 이름으로 국가대표 팀 ID 가져오기
async function getNationalTeamId(countryName: string): Promise<number | null> {
	const mapped = COUNTRY_NAME_MAP[countryName] || countryName;
	const data = (await apiFetch(`/teams?country=${encodeURIComponent(mapped)}`)) as {
		response: Array<{ team: { id: number; name: string; national: boolean } }>;
	};

	// national: true인 팀 찾기
	const nationalTeam = data.response?.find((t) => t.team.national);
	return nationalTeam?.team.id ?? null;
}

// 팀 ID로 스쿼드 가져오기
async function getSquad(teamId: number): Promise<ApiPlayer[]> {
	const data = (await apiFetch(`/players/squads?team=${teamId}`)) as {
		response: Array<{ players: ApiPlayer[] }>;
	};

	return data.response?.[0]?.players ?? [];
}

// countries.ts에서 국가 목록 읽기
function getCountryNames(): string[] {
	const filePath = resolve(import.meta.dir, "../src/data/countries.ts");
	const content = readFileSync(filePath, "utf-8");
	const names: string[] = [];
	const regex = /name:\s*"([^"]+)"/g;
	let match: RegExpExecArray | null;
	match = regex.exec(content);
	while (match !== null) {
		names.push(match[1]);
		match = regex.exec(content);
	}
	return names;
}

// 국가 코드 매핑 읽기
function getCountryCodeMap(): Record<string, string> {
	const filePath = resolve(import.meta.dir, "../src/data/countries.ts");
	const content = readFileSync(filePath, "utf-8");
	const map: Record<string, string> = {};
	const regex = /name:\s*"([^"]+)"[\s\S]*?code:\s*"([^"]+)"/g;
	let match: RegExpExecArray | null;
	match = regex.exec(content);
	while (match !== null) {
		map[match[1]] = match[2];
		match = regex.exec(content);
	}
	return map;
}

async function main() {
	const countries = getCountryNames();
	const codeMap = getCountryCodeMap();
	const cache = loadCache();

	console.log(`📋 총 ${countries.length}개 국가`);
	console.log(`📦 캐시에 ${Object.keys(cache).length}개 국가 저장됨`);

	let requestCount = 0;
	const MAX_REQUESTS_PER_RUN = 90; // 안전 마진

	for (const name of countries) {
		const code = codeMap[name];
		if (!code) {
			console.log(`⚠️  ${name}: 코드 없음, 건너뜀`);
			continue;
		}

		// 이미 캐시에 있으면 건너뜀
		if (cache[code]) {
			continue;
		}

		if (requestCount >= MAX_REQUESTS_PER_RUN) {
			console.log(`\n⏸️  일일 요청 한도 근접 (${requestCount}회). 내일 다시 실행하세요.`);
			break;
		}

		try {
			// 1. 팀 ID 조회
			console.log(`🔍 ${name} (${code}): 팀 ID 조회 중...`);
			const teamId = await getNationalTeamId(name);
			requestCount++;

			if (!teamId) {
				console.log(`   ❌ 국가대표 팀을 찾을 수 없음 → fallback 사용`);
				cache[code] = { teamId: null, players: [], fetchedAt: new Date().toISOString() };
				saveCache(cache);
				continue;
			}

			// 2. 스쿼드 조회
			console.log(`   👥 팀 ID ${teamId}: 스쿼드 조회 중...`);
			const players = await getSquad(teamId);
			requestCount++;

			console.log(`   ✅ ${players.length}명 선수 로드 완료`);
			cache[code] = { teamId, players, fetchedAt: new Date().toISOString() };
			saveCache(cache);

			// rate limit 방지 (1초 대기)
			await new Promise((r) => setTimeout(r, 1000));
		} catch (err) {
			console.error(`   ❌ ${name} 에러:`, (err as Error).message);
			// rate limit 에러면 중단
			if ((err as Error).message.includes("429")) {
				console.log("\n⏸️  Rate limit 도달. 내일 다시 실행하세요.");
				break;
			}
		}
	}

	// 최종 출력 파일 생성
	const output: Record<string, Array<{ id: number; name: string; position: string; age: number; number: number; photo: string }>> = {};

	for (const [code, entry] of Object.entries(cache)) {
		if (entry.players.length > 0) {
			output[code] = entry.players.map((p) => ({
				id: p.id,
				name: p.name,
				position: p.position,
				age: p.age,
				number: p.number ?? 0,
				photo: p.photo,
			}));
		}
	}

	writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
	console.log(`\n✅ ${OUTPUT_PATH}에 ${Object.keys(output).length}개 국가 데이터 저장 완료`);
	console.log(`📊 총 API 요청: ${requestCount}회`);
}

main().catch(console.error);
