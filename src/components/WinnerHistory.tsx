import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18nContext";

export interface WinnerRecord {
	flag: string;
	nameKo: string;
	name: string;
	rank: number;
	size: 32 | 48;
	winRate: number;
	date: string;
	opponentFlag?: string;
	opponentNameKo?: string;
	opponentName?: string;
}

const STORAGE_KEY = "worldcup-winners";

export function loadHistory(): WinnerRecord[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		return JSON.parse(raw) as WinnerRecord[];
	} catch {
		return [];
	}
}

export function saveWinner(record: WinnerRecord) {
	const history = loadHistory();
	history.unshift(record);
	localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 50)));
}

export function clearHistory() {
	localStorage.removeItem(STORAGE_KEY);
}

export function WinnerHistory() {
	const { t, locale } = useI18n();
	const [open, setOpen] = useState(false);
	const [history, setHistory] = useState(loadHistory);
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		const handleClick = (e: MouseEvent) => {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [open]);

	const handleToggle = () => {
		if (!open) setHistory(loadHistory()); // 열 때마다 최신 기록 로드
		setOpen(!open);
	};

	const handleClear = () => {
		clearHistory();
		setHistory([]);
	};

	return (
		<div ref={panelRef} className={`history-panel ${open ? "open" : ""}`}>
			<button type="button" className="history-toggle" onClick={handleToggle}>
				🏆{" "}
				{open
					? t("history.toggle.open")
					: t("history.toggle.closed", { count: loadHistory().length })}
			</button>

			{open && (
				<div className="history-body">
					{history.length === 0 ? (
						<p className="history-empty">{t("history.empty")}</p>
					) : (
						<>
							<div className="history-list">
								{history.map((r, i) => {
									const displayName = locale === "ko" ? r.nameKo : r.name;
									const opponentName =
										(locale === "ko" ? r.opponentNameKo : r.opponentName) ??
										r.opponentNameKo ??
										r.opponentName ??
										"";
									return (
										<div
											className="history-item"
											key={`${r.date}-${
												// biome-ignore lint/suspicious/noArrayIndexKey: 타임스탬프+인덱스로 고유
												i
											}`}
										>
											<div className="history-row1">
												<span className="history-rank">
													#{history.length - i}
												</span>
												<span className="history-flag">{r.flag}</span>
												<span className="history-name">{displayName}</span>
											</div>
											<div className="history-row2">
												<span className="history-meta">
													{t("history.meta", {
														size: r.size,
														winRate: r.winRate,
													})}
													{r.opponentFlag &&
														t("history.metaVs", {
															flag: r.opponentFlag,
															name: opponentName,
														})}
												</span>
												<span className="history-date">{r.date}</span>
											</div>
										</div>
									);
								})}
							</div>
							<button
								type="button"
								className="history-clear"
								onClick={handleClear}
							>
								{t("history.clear")}
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
}
