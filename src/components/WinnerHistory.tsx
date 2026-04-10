import { useEffect, useRef, useState } from "react";

export interface WinnerRecord {
	flag: string;
	nameKo: string;
	name: string;
	rank: number;
	size: 32 | 48;
	winRate: number;
	date: string;
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
				🏆 {open ? "닫기" : `우승 기록 (${loadHistory().length})`}
			</button>

			{open && (
				<div className="history-body">
					{history.length === 0 ? (
						<p className="history-empty">아직 우승 기록이 없습니다</p>
					) : (
						<>
							<div className="history-list">
								{history.map((r, i) => (
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
											<span className="history-name">{r.nameKo}</span>
										</div>
										<div className="history-row2">
											<span className="history-meta">
												{r.size}강 | 승률 {r.winRate}%
											</span>
											<span className="history-date">{r.date}</span>
										</div>
									</div>
								))}
							</div>
							<button
								type="button"
								className="history-clear"
								onClick={handleClear}
							>
								기록 삭제
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
}
