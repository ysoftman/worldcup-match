import { ListNumbers } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { ALL_COUNTRIES, type Confederation } from "../data/countries";
import { useI18n } from "../i18nContext";

const CONF_ORDER: Confederation[] = [
	"UEFA",
	"CONMEBOL",
	"AFC",
	"CONCACAF",
	"CAF",
	"OFC",
];

export function FifaRanking() {
	const { t, tName } = useI18n();
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
		<div ref={panelRef} className="ranking-panel">
			<button
				type="button"
				className="btn btn-sm"
				aria-expanded={open}
				onClick={() => setOpen(!open)}
			>
				<ListNumbers size={16} weight="bold" />
				{open ? t("ranking.toggle.open") : t("ranking.toggle.closed")}
			</button>

			{open && (
				<div className="popover ranking-body">
					<div className="ranking-source">{t("ranking.source")}</div>
					<div className="ranking-filters">
						<button
							type="button"
							className={`chip ${filter === "ALL" ? "is-selected" : ""}`}
							onClick={() => setFilter("ALL")}
						>
							{t("ranking.all")}
						</button>
						{CONF_ORDER.map((conf) => (
							<button
								type="button"
								key={conf}
								className={`chip ${filter === conf ? "is-selected" : ""}`}
								onClick={() => setFilter(conf)}
							>
								{t(`conf.${conf}`)}
							</button>
						))}
					</div>
					<div className="ranking-list">
						{filtered.map((c) => (
							<div className="ranking-item" key={c.code}>
								<span className="num ranking-pos">{c.rank}</span>
								<span className="ranking-flag">{c.flag}</span>
								<span className="ranking-name">{tName(c)}</span>
								<span className="badge">{t(`conf.${c.conf}`)}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
