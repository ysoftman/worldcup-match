import type { Country } from "./data/countries";

export type Locale = "ko" | "en" | "ja" | "cn" | "fr";

export const LOCALES: Locale[] = ["ko", "en", "ja", "cn", "fr"];

export const LOCALE_LABELS: Record<Locale, string> = {
	ko: "한국어",
	en: "English",
	ja: "日本語",
	cn: "中文",
	fr: "Français",
};

export const LOCALE_SHORT: Record<Locale, string> = {
	ko: "KO",
	en: "EN",
	ja: "JA",
	cn: "CN",
	fr: "FR",
};

export const LOCALE_FLAG: Record<Locale, string> = {
	ko: "🇰🇷",
	en: "🇺🇸",
	ja: "🇯🇵",
	cn: "🇨🇳",
	fr: "🇫🇷",
};

type Dict = Record<string, string>;

const ko: Dict = {
	"app.title.author": "윤준영의",
	"app.title.fifa": "FIFA",
	"app.title.worldcup": "World Cup",
	"app.rankingNote": "FIFA 랭킹 데이터: 2026년 4월 기준",

	"toggle.theme.light": "라이트 모드로 전환",
	"toggle.theme.dark": "다크 모드로 전환",
	"toggle.theme.titleLight": "라이트 모드",
	"toggle.theme.titleDark": "다크 모드",
	"toggle.sound.on": "사운드 켜기",
	"toggle.sound.off": "사운드 끄기",
	"toggle.bgm.on": "배경음악 켜기",
	"toggle.bgm.off": "배경음악 끄기",
	"toggle.dadjoke": "아재개그",
	"toggle.language": "언어 변경",

	"phase.select": "선택",
	"phase.ball": "바운스볼",
	"phase.group": "조별리그",
	"phase.knockout": "토너먼트",
	"phase.finished": "완료",

	"size.32": "32강 (8조)",
	"size.48": "48강 (12조)",

	"btn.start": "🏆 대회 시작",
	"btn.startBall": "⚽ 바운스볼 대회 시작",
	"btn.playAllGroup": "조별 리그 전체 진행",
	"btn.reset": "새 대회",
	"btn.playAllRound": "{round} 전체 진행",
	"btn.advanceTo": "{round} 진출",

	"section.tournament": "토너먼트",
	"section.groupStage": "조별 리그",
	"swap.selected": "{flag} {name} 선택됨 — 다른 조의 팀을 클릭하면 교환됩니다",
	"swap.cancel": "취소",
	"swap.hint": "팀을 클릭하면 다른 조의 팀과 교환할 수 있습니다",

	"round.round32": "32강",
	"round.round16": "16강",
	"round.quarter": "8강",
	"round.semi": "4강",
	"round.final": "결승",

	"group.prefix": "",
	"group.suffix": "조",

	"selector.title": "참가국 선택",
	"selector.region.all": "전세계",
	"selector.region.AFC": "아시아",
	"selector.region.UEFA": "유럽",
	"selector.region.europe-africa": "유럽+아프리카",
	"selector.region.CAF": "아프리카",
	"selector.region.americas": "아메리카",
	"selector.region.CONCACAF": "북중미",
	"selector.region.CONMEBOL": "남미",
	"selector.region.OFC": "오세아니아",
	"selector.regionRandom": "{region} 랜덤",
	"selector.searchPlaceholder": "국가 검색",

	"groupTable.team": "팀",
	"groupTable.played": "경기",
	"groupTable.wins": "승",
	"groupTable.draws": "무",
	"groupTable.losses": "패",
	"groupTable.goalsFor": "득",
	"groupTable.goalsAgainst": "실",
	"groupTable.goalDiff": "득실",
	"groupTable.points": "승점",
	"groupTable.winRate": "승률",

	"groupCircle.squadView": "스쿼드 보기",
	"groupCircle.atkUp": "공격력 증가",
	"groupCircle.defUp": "수비력 증가",
	"groupCircle.squadViewOf": "{name} 스쿼드 보기",
	"groupCircle.atkUpOf": "{name} 공격력 증가",
	"groupCircle.defUpOf": "{name} 수비력 증가",

	"match.draw": "무",

	"champion.rank": "FIFA 랭킹 #{rank}",
	"champion.label": "월드컵 우승",
	"champion.stats":
		"{played}경기 {wins}승 {draws}무 {losses}패 (승률 {winRate}%)",

	"squad.title": "{flag} {name} 스쿼드",
	"squad.avg": "팀 평균 OVR: {value}",
	"squad.close": "모달 닫기",
	"squad.starting": "선발 {count}/11명",
	"squad.startingAvg": " (평균 OVR: {value})",
	"squad.generated": "가상 선수",
	"squad.filter": "포지션 필터",
	"squad.filter.all": "전체",
	"squad.column.starter": "선발",
	"squad.column.name": "이름",
	"squad.column.position": "포지션",
	"squad.column.pace": "속도",
	"squad.column.shooting": "슈팅",
	"squad.column.passing": "패스",
	"squad.column.dribbling": "드리블",
	"squad.column.defending": "수비",
	"squad.column.physical": "체력",
	"squad.column.height": "키",
	"squad.column.age": "나이",
	"squad.autoSelect": "자동 선택",
	"squad.reset": "초기화",
	"squad.confirm": "확인",
	"squad.closeBtn": "닫기",

	"history.toggle.open": "닫기",
	"history.toggle.closed": "우승 기록 ({count})",
	"history.empty": "아직 우승 기록이 없습니다",
	"history.meta": "{size}강 | 승률 {winRate}%",
	"history.metaVs": " | vs {flag} {name}",
	"history.clear": "기록 삭제",

	"ranking.toggle.open": "닫기",
	"ranking.toggle.closed": "FIFA 랭킹",
	"ranking.source": "FIFA/Coca-Cola 세계 랭킹 · 2026년 4월 기준",
	"ranking.all": "전체",

	"ball.progress": "진출 {advanced} / {target}",
	"ball.progressElim": "탈락 {eliminated} / {target}",
	"ball.startRound": "{round} 시작",
	"ball.restart": "↺ 다시",
	"ball.restartTitle": "이번 라운드를 처음부터 다시",
	"ball.advanced": "진출",
	"ball.eliminated": "탈락 (이번 라운드)",
	"ball.final": "결승",
	"ball.roundN": "{n}강",
	"ball.elimConfig": "라운드당 탈락국가 수",
	"ball.elimHalving": "기본 (절반 진출)",
	"ball.elimN": "{n}개 탈락",

	"conf.AFC": "아시아",
	"conf.UEFA": "유럽",
	"conf.CONCACAF": "북중미",
	"conf.CONMEBOL": "남미",
	"conf.CAF": "아프리카",
	"conf.OFC": "오세아니아",

	"preset.2026": "2026 북중미 월드컵",
	"preset.2022": "2022 카타르 월드컵",
	"preset.2018": "2018 러시아 월드컵",
	"preset.2014": "2014 브라질 월드컵",
	"preset.2010": "2010 남아공 월드컵",
	"preset.2006": "2006 독일 월드컵",
	"preset.2002": "2002 한일 월드컵",
};

const en: Dict = {
	"app.title.author": "Junyoung Yoon's",
	"app.title.fifa": "FIFA",
	"app.title.worldcup": "World Cup",
	"app.rankingNote": "FIFA ranking data: as of April 2026",

	"toggle.theme.light": "Switch to light mode",
	"toggle.theme.dark": "Switch to dark mode",
	"toggle.theme.titleLight": "Light mode",
	"toggle.theme.titleDark": "Dark mode",
	"toggle.sound.on": "Turn sound on",
	"toggle.sound.off": "Turn sound off",
	"toggle.bgm.on": "Turn BGM on",
	"toggle.bgm.off": "Turn BGM off",
	"toggle.dadjoke": "Dad jokes",
	"toggle.language": "Change language",

	"phase.select": "Select",
	"phase.ball": "Bounce Ball",
	"phase.group": "Group Stage",
	"phase.knockout": "Knockout",
	"phase.finished": "Finished",

	"size.32": "32 teams (8 groups)",
	"size.48": "48 teams (12 groups)",

	"btn.start": "🏆 Start Tournament",
	"btn.startBall": "⚽ Start Bounce Ball",
	"btn.playAllGroup": "Play all group matches",
	"btn.reset": "New Tournament",
	"btn.playAllRound": "Play all {round} matches",
	"btn.advanceTo": "Advance to {round}",

	"section.tournament": "Tournament",
	"section.groupStage": "Group Stage",
	"swap.selected":
		"{flag} {name} selected — click a team in another group to swap",
	"swap.cancel": "Cancel",
	"swap.hint": "Click a team to swap it with a team from another group",

	"round.round32": "Round of 32",
	"round.round16": "Round of 16",
	"round.quarter": "Quarterfinal",
	"round.semi": "Semifinal",
	"round.final": "Final",

	"group.prefix": "Group ",
	"group.suffix": "",

	"selector.title": "Select Teams",
	"selector.region.all": "World",
	"selector.region.AFC": "Asia",
	"selector.region.UEFA": "Europe",
	"selector.region.europe-africa": "Europe+Africa",
	"selector.region.CAF": "Africa",
	"selector.region.americas": "Americas",
	"selector.region.CONCACAF": "N. & C. America",
	"selector.region.CONMEBOL": "S. America",
	"selector.region.OFC": "Oceania",
	"selector.regionRandom": "{region} Random",
	"selector.searchPlaceholder": "Search country",

	"groupTable.team": "Team",
	"groupTable.played": "P",
	"groupTable.wins": "W",
	"groupTable.draws": "D",
	"groupTable.losses": "L",
	"groupTable.goalsFor": "GF",
	"groupTable.goalsAgainst": "GA",
	"groupTable.goalDiff": "GD",
	"groupTable.points": "Pts",
	"groupTable.winRate": "Win%",

	"groupCircle.squadView": "View squad",
	"groupCircle.atkUp": "Boost attack",
	"groupCircle.defUp": "Boost defense",
	"groupCircle.squadViewOf": "View {name} squad",
	"groupCircle.atkUpOf": "Boost {name} attack",
	"groupCircle.defUpOf": "Boost {name} defense",

	"match.draw": "D",

	"champion.rank": "FIFA Rank #{rank}",
	"champion.label": "World Cup Champion",
	"champion.stats":
		"{played} played, {wins}W {draws}D {losses}L (Win rate {winRate}%)",

	"squad.title": "{flag} {name} Squad",
	"squad.avg": "Team Avg OVR: {value}",
	"squad.close": "Close modal",
	"squad.starting": "Starting {count}/11",
	"squad.startingAvg": " (Avg OVR: {value})",
	"squad.generated": "Virtual player",
	"squad.filter": "Position filter",
	"squad.filter.all": "All",
	"squad.column.starter": "XI",
	"squad.column.name": "Name",
	"squad.column.position": "Pos",
	"squad.column.pace": "Pace",
	"squad.column.shooting": "Shot",
	"squad.column.passing": "Pass",
	"squad.column.dribbling": "Drib",
	"squad.column.defending": "Def",
	"squad.column.physical": "Phy",
	"squad.column.height": "Ht",
	"squad.column.age": "Age",
	"squad.autoSelect": "Auto-pick",
	"squad.reset": "Reset",
	"squad.confirm": "Confirm",
	"squad.closeBtn": "Close",

	"history.toggle.open": "Close",
	"history.toggle.closed": "Winners ({count})",
	"history.empty": "No winners yet",
	"history.meta": "{size} teams | Win rate {winRate}%",
	"history.metaVs": " | vs {flag} {name}",
	"history.clear": "Clear history",

	"ranking.toggle.open": "Close",
	"ranking.toggle.closed": "FIFA Ranking",
	"ranking.source": "FIFA/Coca-Cola World Ranking · As of April 2026",
	"ranking.all": "All",

	"ball.progress": "Advanced {advanced} / {target}",
	"ball.progressElim": "Eliminated {eliminated} / {target}",
	"ball.startRound": "Start {round}",
	"ball.restart": "↺ Restart",
	"ball.restartTitle": "Restart this round from the beginning",
	"ball.advanced": "Advanced",
	"ball.eliminated": "Eliminated (this round)",
	"ball.final": "Final",
	"ball.roundN": "Round of {n}",
	"ball.elimConfig": "Eliminations per round",
	"ball.elimHalving": "Default (halve each round)",
	"ball.elimN": "Eliminate {n}",

	"conf.AFC": "Asia",
	"conf.UEFA": "Europe",
	"conf.CONCACAF": "N. & C. America",
	"conf.CONMEBOL": "S. America",
	"conf.CAF": "Africa",
	"conf.OFC": "Oceania",

	"preset.2026": "2026 North America World Cup",
	"preset.2022": "2022 Qatar World Cup",
	"preset.2018": "2018 Russia World Cup",
	"preset.2014": "2014 Brazil World Cup",
	"preset.2010": "2010 South Africa World Cup",
	"preset.2006": "2006 Germany World Cup",
	"preset.2002": "2002 Korea–Japan World Cup",
};

const ja: Dict = {
	"app.title.author": "ユン・ジュニョンの",
	"app.title.fifa": "FIFA",
	"app.title.worldcup": "ワールドカップ",
	"app.rankingNote": "FIFAランキングデータ: 2026年4月時点",

	"toggle.theme.light": "ライトモードに切り替え",
	"toggle.theme.dark": "ダークモードに切り替え",
	"toggle.theme.titleLight": "ライトモード",
	"toggle.theme.titleDark": "ダークモード",
	"toggle.sound.on": "サウンドをオン",
	"toggle.sound.off": "サウンドをオフ",
	"toggle.bgm.on": "BGMをオン",
	"toggle.bgm.off": "BGMをオフ",
	"toggle.dadjoke": "おやじギャグ",
	"toggle.language": "言語を変更",

	"phase.select": "選択",
	"phase.ball": "バウンスボール",
	"phase.group": "グループリーグ",
	"phase.knockout": "トーナメント",
	"phase.finished": "完了",

	"size.32": "32チーム (8組)",
	"size.48": "48チーム (12組)",

	"btn.start": "🏆 大会開始",
	"btn.startBall": "⚽ バウンスボール開始",
	"btn.playAllGroup": "グループリーグ全試合",
	"btn.reset": "新規大会",
	"btn.playAllRound": "{round} 全試合",
	"btn.advanceTo": "{round} 進出",

	"section.tournament": "トーナメント",
	"section.groupStage": "グループリーグ",
	"swap.selected":
		"{flag} {name} 選択中 — 他の組のチームをクリックすると交換します",
	"swap.cancel": "キャンセル",
	"swap.hint": "チームをクリックすると他の組のチームと交換できます",

	"round.round32": "ベスト32",
	"round.round16": "ベスト16",
	"round.quarter": "準々決勝",
	"round.semi": "準決勝",
	"round.final": "決勝",

	"group.prefix": "",
	"group.suffix": "組",

	"selector.title": "参加国選択",
	"selector.region.all": "全世界",
	"selector.region.AFC": "アジア",
	"selector.region.UEFA": "ヨーロッパ",
	"selector.region.europe-africa": "欧州+アフリカ",
	"selector.region.CAF": "アフリカ",
	"selector.region.americas": "アメリカ大陸",
	"selector.region.CONCACAF": "北中米",
	"selector.region.CONMEBOL": "南米",
	"selector.region.OFC": "オセアニア",
	"selector.regionRandom": "{region} ランダム",
	"selector.searchPlaceholder": "国を検索",

	"groupTable.team": "チーム",
	"groupTable.played": "試合",
	"groupTable.wins": "勝",
	"groupTable.draws": "分",
	"groupTable.losses": "敗",
	"groupTable.goalsFor": "得",
	"groupTable.goalsAgainst": "失",
	"groupTable.goalDiff": "得失",
	"groupTable.points": "勝点",
	"groupTable.winRate": "勝率",

	"groupCircle.squadView": "スカッドを見る",
	"groupCircle.atkUp": "攻撃力アップ",
	"groupCircle.defUp": "守備力アップ",
	"groupCircle.squadViewOf": "{name} スカッドを見る",
	"groupCircle.atkUpOf": "{name} 攻撃力アップ",
	"groupCircle.defUpOf": "{name} 守備力アップ",

	"match.draw": "分",

	"champion.rank": "FIFAランキング #{rank}",
	"champion.label": "ワールドカップ優勝",
	"champion.stats":
		"{played}試合 {wins}勝 {draws}分 {losses}敗 (勝率 {winRate}%)",

	"squad.title": "{flag} {name} スカッド",
	"squad.avg": "チーム平均OVR: {value}",
	"squad.close": "モーダルを閉じる",
	"squad.starting": "先発 {count}/11人",
	"squad.startingAvg": " (平均OVR: {value})",
	"squad.generated": "仮想選手",
	"squad.filter": "ポジションフィルター",
	"squad.filter.all": "全て",
	"squad.column.starter": "先発",
	"squad.column.name": "名前",
	"squad.column.position": "ポジション",
	"squad.column.pace": "速度",
	"squad.column.shooting": "シュート",
	"squad.column.passing": "パス",
	"squad.column.dribbling": "ドリブル",
	"squad.column.defending": "守備",
	"squad.column.physical": "体力",
	"squad.column.height": "身長",
	"squad.column.age": "年齢",
	"squad.autoSelect": "自動選択",
	"squad.reset": "リセット",
	"squad.confirm": "確認",
	"squad.closeBtn": "閉じる",

	"history.toggle.open": "閉じる",
	"history.toggle.closed": "優勝記録 ({count})",
	"history.empty": "まだ優勝記録がありません",
	"history.meta": "{size}チーム | 勝率 {winRate}%",
	"history.metaVs": " | vs {flag} {name}",
	"history.clear": "記録を削除",

	"ranking.toggle.open": "閉じる",
	"ranking.toggle.closed": "FIFAランキング",
	"ranking.source": "FIFA/Coca-Cola 世界ランキング · 2026年4月時点",
	"ranking.all": "全体",

	"ball.progress": "進出 {advanced} / {target}",
	"ball.progressElim": "敗退 {eliminated} / {target}",
	"ball.startRound": "{round} 開始",
	"ball.restart": "↺ やり直し",
	"ball.restartTitle": "このラウンドを最初からやり直す",
	"ball.advanced": "進出",
	"ball.eliminated": "敗退 (今ラウンド)",
	"ball.final": "決勝",
	"ball.roundN": "ベスト{n}",
	"ball.elimConfig": "1ラウンドの敗退国数",
	"ball.elimHalving": "デフォルト (半数進出)",
	"ball.elimN": "{n}カ国敗退",

	"conf.AFC": "アジア",
	"conf.UEFA": "ヨーロッパ",
	"conf.CONCACAF": "北中米",
	"conf.CONMEBOL": "南米",
	"conf.CAF": "アフリカ",
	"conf.OFC": "オセアニア",

	"preset.2026": "2026 北中米ワールドカップ",
	"preset.2022": "2022 カタールワールドカップ",
	"preset.2018": "2018 ロシアワールドカップ",
	"preset.2014": "2014 ブラジルワールドカップ",
	"preset.2010": "2010 南アフリカワールドカップ",
	"preset.2006": "2006 ドイツワールドカップ",
	"preset.2002": "2002 日韓ワールドカップ",
};

const cn: Dict = {
	"app.title.author": "尹俊英的",
	"app.title.fifa": "FIFA",
	"app.title.worldcup": "世界杯",
	"app.rankingNote": "FIFA排名数据：2026年4月",

	"toggle.theme.light": "切换到浅色模式",
	"toggle.theme.dark": "切换到深色模式",
	"toggle.theme.titleLight": "浅色模式",
	"toggle.theme.titleDark": "深色模式",
	"toggle.sound.on": "开启音效",
	"toggle.sound.off": "关闭音效",
	"toggle.bgm.on": "开启背景音乐",
	"toggle.bgm.off": "关闭背景音乐",
	"toggle.dadjoke": "冷笑话",
	"toggle.language": "切换语言",

	"phase.select": "选择",
	"phase.ball": "弹球",
	"phase.group": "小组赛",
	"phase.knockout": "淘汰赛",
	"phase.finished": "完成",

	"size.32": "32强 (8组)",
	"size.48": "48强 (12组)",

	"btn.start": "🏆 开始比赛",
	"btn.startBall": "⚽ 开始弹球赛",
	"btn.playAllGroup": "进行所有小组赛",
	"btn.reset": "新比赛",
	"btn.playAllRound": "进行 {round} 全部比赛",
	"btn.advanceTo": "进入 {round}",

	"section.tournament": "淘汰赛",
	"section.groupStage": "小组赛",
	"swap.selected": "{flag} {name} 已选中 — 点击其他组的球队进行交换",
	"swap.cancel": "取消",
	"swap.hint": "点击球队可与其他组的球队交换",

	"round.round32": "32强",
	"round.round16": "16强",
	"round.quarter": "8强",
	"round.semi": "4强",
	"round.final": "决赛",

	"group.prefix": "",
	"group.suffix": "组",

	"selector.title": "选择参赛国",
	"selector.region.all": "全球",
	"selector.region.AFC": "亚洲",
	"selector.region.UEFA": "欧洲",
	"selector.region.europe-africa": "欧洲+非洲",
	"selector.region.CAF": "非洲",
	"selector.region.americas": "美洲",
	"selector.region.CONCACAF": "中北美",
	"selector.region.CONMEBOL": "南美",
	"selector.region.OFC": "大洋洲",
	"selector.regionRandom": "{region} 随机",
	"selector.searchPlaceholder": "搜索国家",

	"groupTable.team": "球队",
	"groupTable.played": "赛",
	"groupTable.wins": "胜",
	"groupTable.draws": "平",
	"groupTable.losses": "负",
	"groupTable.goalsFor": "进",
	"groupTable.goalsAgainst": "失",
	"groupTable.goalDiff": "净胜",
	"groupTable.points": "积分",
	"groupTable.winRate": "胜率",

	"groupCircle.squadView": "查看阵容",
	"groupCircle.atkUp": "提升攻击",
	"groupCircle.defUp": "提升防守",
	"groupCircle.squadViewOf": "查看 {name} 阵容",
	"groupCircle.atkUpOf": "提升 {name} 攻击",
	"groupCircle.defUpOf": "提升 {name} 防守",

	"match.draw": "平",

	"champion.rank": "FIFA排名 #{rank}",
	"champion.label": "世界杯冠军",
	"champion.stats":
		"{played}场 {wins}胜 {draws}平 {losses}负 (胜率 {winRate}%)",

	"squad.title": "{flag} {name} 阵容",
	"squad.avg": "球队平均OVR: {value}",
	"squad.close": "关闭弹窗",
	"squad.starting": "首发 {count}/11人",
	"squad.startingAvg": " (平均OVR: {value})",
	"squad.generated": "虚拟球员",
	"squad.filter": "位置筛选",
	"squad.filter.all": "全部",
	"squad.column.starter": "首发",
	"squad.column.name": "姓名",
	"squad.column.position": "位置",
	"squad.column.pace": "速度",
	"squad.column.shooting": "射门",
	"squad.column.passing": "传球",
	"squad.column.dribbling": "盘带",
	"squad.column.defending": "防守",
	"squad.column.physical": "体能",
	"squad.column.height": "身高",
	"squad.column.age": "年龄",
	"squad.autoSelect": "自动选择",
	"squad.reset": "重置",
	"squad.confirm": "确认",
	"squad.closeBtn": "关闭",

	"history.toggle.open": "关闭",
	"history.toggle.closed": "冠军记录 ({count})",
	"history.empty": "还没有冠军记录",
	"history.meta": "{size}强 | 胜率 {winRate}%",
	"history.metaVs": " | vs {flag} {name}",
	"history.clear": "清除记录",

	"ranking.toggle.open": "关闭",
	"ranking.toggle.closed": "FIFA排名",
	"ranking.source": "FIFA/可口可乐世界排名 · 2026年4月",
	"ranking.all": "全部",

	"ball.progress": "晋级 {advanced} / {target}",
	"ball.progressElim": "淘汰 {eliminated} / {target}",
	"ball.startRound": "开始 {round}",
	"ball.restart": "↺ 重来",
	"ball.restartTitle": "从头重新开始这一轮",
	"ball.advanced": "晋级",
	"ball.eliminated": "淘汰 (本轮)",
	"ball.final": "决赛",
	"ball.roundN": "{n}强",
	"ball.elimConfig": "每轮淘汰国家数",
	"ball.elimHalving": "默认 (半数晋级)",
	"ball.elimN": "淘汰 {n} 国",

	"conf.AFC": "亚洲",
	"conf.UEFA": "欧洲",
	"conf.CONCACAF": "中北美",
	"conf.CONMEBOL": "南美",
	"conf.CAF": "非洲",
	"conf.OFC": "大洋洲",

	"preset.2026": "2026 中北美世界杯",
	"preset.2022": "2022 卡塔尔世界杯",
	"preset.2018": "2018 俄罗斯世界杯",
	"preset.2014": "2014 巴西世界杯",
	"preset.2010": "2010 南非世界杯",
	"preset.2006": "2006 德国世界杯",
	"preset.2002": "2002 韩日世界杯",
};

const fr: Dict = {
	"app.title.author": "Junyoung Yoon —",
	"app.title.fifa": "FIFA",
	"app.title.worldcup": "Coupe du Monde",
	"app.rankingNote": "Classement FIFA : avril 2026",

	"toggle.theme.light": "Passer en mode clair",
	"toggle.theme.dark": "Passer en mode sombre",
	"toggle.theme.titleLight": "Mode clair",
	"toggle.theme.titleDark": "Mode sombre",
	"toggle.sound.on": "Activer le son",
	"toggle.sound.off": "Couper le son",
	"toggle.bgm.on": "Activer la musique",
	"toggle.bgm.off": "Couper la musique",
	"toggle.dadjoke": "Blagues de papa",
	"toggle.language": "Changer de langue",

	"phase.select": "Sélection",
	"phase.ball": "Balles rebondissantes",
	"phase.group": "Phase de groupes",
	"phase.knockout": "Phase finale",
	"phase.finished": "Terminé",

	"size.32": "32 équipes (8 groupes)",
	"size.48": "48 équipes (12 groupes)",

	"btn.start": "🏆 Démarrer le tournoi",
	"btn.startBall": "⚽ Démarrer les balles",
	"btn.playAllGroup": "Jouer toute la phase de groupes",
	"btn.reset": "Nouveau tournoi",
	"btn.playAllRound": "Jouer tous les matchs : {round}",
	"btn.advanceTo": "Passer en {round}",

	"section.tournament": "Phase finale",
	"section.groupStage": "Phase de groupes",
	"swap.selected":
		"{flag} {name} sélectionné — cliquez une équipe d'un autre groupe pour échanger",
	"swap.cancel": "Annuler",
	"swap.hint":
		"Cliquez sur une équipe pour l'échanger avec une équipe d'un autre groupe",

	"round.round32": "32es de finale",
	"round.round16": "8es de finale",
	"round.quarter": "Quarts de finale",
	"round.semi": "Demi-finales",
	"round.final": "Finale",

	"group.prefix": "Groupe ",
	"group.suffix": "",

	"selector.title": "Choisir les équipes",
	"selector.region.all": "Monde",
	"selector.region.AFC": "Asie",
	"selector.region.UEFA": "Europe",
	"selector.region.europe-africa": "Europe+Afrique",
	"selector.region.CAF": "Afrique",
	"selector.region.americas": "Amériques",
	"selector.region.CONCACAF": "Amérique du Nord/Centrale",
	"selector.region.CONMEBOL": "Amérique du Sud",
	"selector.region.OFC": "Océanie",
	"selector.regionRandom": "{region} aléatoire",
	"selector.searchPlaceholder": "Rechercher un pays",

	"groupTable.team": "Équipe",
	"groupTable.played": "J",
	"groupTable.wins": "V",
	"groupTable.draws": "N",
	"groupTable.losses": "D",
	"groupTable.goalsFor": "BP",
	"groupTable.goalsAgainst": "BC",
	"groupTable.goalDiff": "DB",
	"groupTable.points": "Pts",
	"groupTable.winRate": "%V",

	"groupCircle.squadView": "Voir l'effectif",
	"groupCircle.atkUp": "Renforcer l'attaque",
	"groupCircle.defUp": "Renforcer la défense",
	"groupCircle.squadViewOf": "Voir l'effectif de {name}",
	"groupCircle.atkUpOf": "Renforcer l'attaque de {name}",
	"groupCircle.defUpOf": "Renforcer la défense de {name}",

	"match.draw": "N",

	"champion.rank": "Classement FIFA #{rank}",
	"champion.label": "Champion du Monde",
	"champion.stats":
		"{played} joués, {wins}V {draws}N {losses}D (taux de victoire {winRate}%)",

	"squad.title": "{flag} Effectif — {name}",
	"squad.avg": "OVR moyen : {value}",
	"squad.close": "Fermer la fenêtre",
	"squad.starting": "Titulaires {count}/11",
	"squad.startingAvg": " (OVR moyen : {value})",
	"squad.generated": "Joueur virtuel",
	"squad.filter": "Filtre de poste",
	"squad.filter.all": "Tous",
	"squad.column.starter": "XI",
	"squad.column.name": "Nom",
	"squad.column.position": "Poste",
	"squad.column.pace": "Vit.",
	"squad.column.shooting": "Tir",
	"squad.column.passing": "Passe",
	"squad.column.dribbling": "Dribble",
	"squad.column.defending": "Déf.",
	"squad.column.physical": "Phys.",
	"squad.column.height": "Taille",
	"squad.column.age": "Âge",
	"squad.autoSelect": "Sélection auto",
	"squad.reset": "Réinitialiser",
	"squad.confirm": "Valider",
	"squad.closeBtn": "Fermer",

	"history.toggle.open": "Fermer",
	"history.toggle.closed": "Vainqueurs ({count})",
	"history.empty": "Aucun vainqueur pour le moment",
	"history.meta": "{size} équipes | Taux de victoire {winRate}%",
	"history.metaVs": " | contre {flag} {name}",
	"history.clear": "Effacer l'historique",

	"ranking.toggle.open": "Fermer",
	"ranking.toggle.closed": "Classement FIFA",
	"ranking.source": "Classement FIFA/Coca-Cola · avril 2026",
	"ranking.all": "Tous",

	"ball.progress": "Qualifiés {advanced} / {target}",
	"ball.progressElim": "Éliminés {eliminated} / {target}",
	"ball.startRound": "Démarrer — {round}",
	"ball.restart": "↺ Recommencer",
	"ball.restartTitle": "Recommencer cette manche depuis le début",
	"ball.advanced": "Qualifiés",
	"ball.eliminated": "Éliminés (cette manche)",
	"ball.final": "Finale",
	"ball.roundN": "{n}es",
	"ball.elimConfig": "Éliminés par manche",
	"ball.elimHalving": "Défaut (moitié qualifiée)",
	"ball.elimN": "Éliminer {n}",

	"conf.AFC": "Asie",
	"conf.UEFA": "Europe",
	"conf.CONCACAF": "Amérique du N./C.",
	"conf.CONMEBOL": "Amérique du Sud",
	"conf.CAF": "Afrique",
	"conf.OFC": "Océanie",

	"preset.2026": "Coupe du Monde 2026 (Amérique du Nord)",
	"preset.2022": "Coupe du Monde 2022 (Qatar)",
	"preset.2018": "Coupe du Monde 2018 (Russie)",
	"preset.2014": "Coupe du Monde 2014 (Brésil)",
	"preset.2010": "Coupe du Monde 2010 (Afrique du Sud)",
	"preset.2006": "Coupe du Monde 2006 (Allemagne)",
	"preset.2002": "Coupe du Monde 2002 (Corée–Japon)",
};

const DICTIONARIES: Record<Locale, Dict> = { ko, en, ja, cn, fr };

export type Translator = (
	key: string,
	vars?: Record<string, string | number>,
) => string;

function interpolate(
	template: string,
	vars?: Record<string, string | number>,
): string {
	if (!vars) return template;
	return template.replace(/\{(\w+)\}/g, (_, k) =>
		vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
	);
}

export function createTranslator(locale: Locale): Translator {
	const dict = DICTIONARIES[locale] ?? DICTIONARIES.ko;
	const fallback = DICTIONARIES.ko;
	return (key, vars) => {
		const raw = dict[key] ?? fallback[key] ?? key;
		return interpolate(raw, vars);
	};
}

/** Team display name — Korean uses `nameKo`, others fall back to English `name`. */
export function getTeamName(team: Country, locale: Locale): string {
	return locale === "ko" ? team.nameKo : team.name;
}

/**
 * Format a group name. Stored group names look like "A조", "B조"...
 * We extract the letter and render locale-specific surrounding label.
 */
export function formatGroupName(
	storedName: string,
	locale: Locale,
	t: Translator,
): string {
	const letter = storedName.replace(/[^A-Z]/g, "") || storedName;
	const prefix = t("group.prefix");
	const suffix = t("group.suffix");
	if (locale === "en") return `${prefix}${letter}`;
	return `${letter}${suffix}`;
}
