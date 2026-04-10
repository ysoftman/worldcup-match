import { useEffect, useRef, useState } from "react";
import {
	ALL_COUNTRIES,
	CONFEDERATION_LABELS,
	type Confederation,
} from "../data/countries";

const CONF_ORDER: Confederation[] = [
	"UEFA",
	"CONMEBOL",
	"AFC",
	"CONCACAF",
	"CAF",
	"OFC",
];

export function FifaRanking() {
	const [open, setOpen] = useState(false);
	const [filter, setFilter] = useState<Confederation | "ALL">("ALL");
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

	const filtered = (
		filter === "ALL"
			? ALL_COUNTRIES
			: ALL_COUNTRIES.filter((c) => c.conf === filter)
	).toSorted((a, b) => a.rank - b.rank);

	return (
		<div ref={panelRef} className={`ranking-panel ${open ? "open" : ""}`}>
			<button
				type="button"
				className="ranking-toggle"
				onClick={() => setOpen(!open)}
			>
				📊 {open ? "닫기" : "FIFA 랭킹"}
			</button>

			{open && (
				<div className="ranking-body">
					<div className="ranking-source">
						FIFA/Coca-Cola 세계 랭킹 · 2026년 4월 기준
					</div>
					<div className="ranking-filters">
						<button
							type="button"
							className={`ranking-filter ${filter === "ALL" ? "active" : ""}`}
							onClick={() => setFilter("ALL")}
						>
							전체
						</button>
						{CONF_ORDER.map((conf) => (
							<button
								type="button"
								key={conf}
								className={`ranking-filter ${filter === conf ? "active" : ""}`}
								onClick={() => setFilter(conf)}
							>
								{CONFEDERATION_LABELS[conf]}
							</button>
						))}
					</div>
					<div className="ranking-list">
						{filtered.map((c) => (
							<div className="ranking-item" key={c.code}>
								<span className="ranking-pos">{c.rank}</span>
								<span className="ranking-flag">{c.flag}</span>
								<span className="ranking-name">{c.nameKo}</span>
								<span className="ranking-conf">
									{CONFEDERATION_LABELS[c.conf]}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
