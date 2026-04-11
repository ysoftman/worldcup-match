import { useEffect, useMemo, useRef, useState } from "react";
import type { Country } from "../data/countries";
import type { Position } from "../types";
import { POSITION_LABELS } from "../types";
import { autoSelectXI, getSquad } from "../utils/playerLoader";

interface SquadModalProps {
	team: Country;
	formationId: string;
	selectedXI: Set<number>;
	onChangeXI: (teamCode: string, xi: Set<number>) => void;
	onClose: () => void;
}

const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];
const POSITION_FILTERS: Array<{ label: string; value: Position | "ALL" }> = [
	{ label: "전체", value: "ALL" },
	{ label: "GK", value: "GK" },
	{ label: "DF", value: "DEF" },
	{ label: "MF", value: "MID" },
	{ label: "FW", value: "FWD" },
];

function statColor(val: number): string {
	if (val >= 80) return "#27ae60";
	if (val >= 60) return "#f1c40f";
	if (val >= 50) return "#e67e22";
	return "#e74c3c";
}

function StatCell({ value }: { value: number }) {
	const pct = Math.min(100, ((value - 30) / 69) * 100);
	return (
		<td className="stat-cell">
			<div className="stat-bar-bg">
				<div
					className="stat-bar-fill"
					style={{
						width: `${pct}%`,
						backgroundColor: statColor(value),
					}}
				/>
			</div>
			<span className="stat-value">{value}</span>
		</td>
	);
}

export function SquadModal({
	team,
	formationId,
	selectedXI,
	onChangeXI,
	onClose,
}: SquadModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [filter, setFilter] = useState<Position | "ALL">("ALL");
	const [localXI, setLocalXI] = useState<Set<number>>(
		() => new Set(selectedXI),
	);

	const squad = useMemo(() => getSquad(team), [team]);

	// 외부 클릭으로 닫기
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [onClose]);

	// ESC로 닫기
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose]);

	const togglePlayer = (playerId: number) => {
		const next = new Set(localXI);
		if (next.has(playerId)) {
			next.delete(playerId);
		} else if (next.size < 11) {
			next.add(playerId);
		}
		setLocalXI(next);
	};

	const handleAutoSelect = () => {
		const auto = autoSelectXI(squad, formationId);
		setLocalXI(auto);
	};

	const handleReset = () => {
		setLocalXI(new Set());
	};

	const handleConfirm = () => {
		onChangeXI(team.code, localXI);
		onClose();
	};

	// 포지션별 필터링
	const filtered =
		filter === "ALL" ? squad : squad.filter((p) => p.position === filter);

	// 포지션별 정렬 (GK → DEF → MID → FWD, 같은 포지션 내 overall 내림차순)
	const sorted = [...filtered].sort((a, b) => {
		const posA = POSITION_ORDER.indexOf(a.position);
		const posB = POSITION_ORDER.indexOf(b.position);
		if (posA !== posB) return posA - posB;
		return b.overall - a.overall;
	});

	// 선발 XI 내 포지션 카운트
	const xiCounts: Record<Position, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
	for (const p of squad) {
		if (localXI.has(p.id)) {
			xiCounts[p.position]++;
		}
	}

	// 팀 평균 OVR
	const avgOverall =
		squad.length > 0
			? Math.round(squad.reduce((s, p) => s + p.overall, 0) / squad.length)
			: 0;

	const xiPlayers = squad.filter((p) => localXI.has(p.id));
	const xiAvg =
		xiPlayers.length > 0
			? Math.round(
					xiPlayers.reduce((s, p) => s + p.overall, 0) / xiPlayers.length,
				)
			: 0;

	return (
		<div className="squad-overlay">
			<div className="squad-modal" ref={modalRef}>
				<div className="squad-header">
					<h3>
						{team.flag} {team.nameKo} 스쿼드
					</h3>
					<span className="squad-avg">팀 평균 OVR: {avgOverall}</span>
					<button type="button" className="squad-close" onClick={onClose}>
						✕
					</button>
				</div>

				<div className="squad-xi-info">
					<span className="xi-count">
						선발 {localXI.size}/11명
						{xiAvg > 0 && <span className="xi-avg"> (평균 OVR: {xiAvg})</span>}
					</span>
					<span className="xi-positions">
						GK:{xiCounts.GK} / DF:{xiCounts.DEF} / MF:{xiCounts.MID} / FW:
						{xiCounts.FWD}
					</span>
				</div>

				<div className="squad-filters">
					{POSITION_FILTERS.map((f) => (
						<button
							key={f.value}
							type="button"
							className={`squad-filter ${filter === f.value ? "active" : ""}`}
							onClick={() => setFilter(f.value)}
						>
							{f.label}
						</button>
					))}
				</div>

				<div className="squad-table-wrap">
					<table className="squad-table">
						<thead>
							<tr>
								<th className="th-check">선발</th>
								<th className="th-num">#</th>
								<th className="th-name">이름</th>
								<th className="th-pos">포지션</th>
								<th className="th-ovr">OVR</th>
								<th className="th-stat">속도</th>
								<th className="th-stat">슈팅</th>
								<th className="th-stat">패스</th>
								<th className="th-stat">드리블</th>
								<th className="th-stat">수비</th>
								<th className="th-stat">체력</th>
								<th className="th-height">키</th>
								<th className="th-age">나이</th>
							</tr>
						</thead>
						<tbody>
							{sorted.map((p) => {
								const isSelected = localXI.has(p.id);
								return (
									<tr
										key={p.id}
										className={`squad-row ${isSelected ? "selected-row" : ""}`}
										onClick={() => togglePlayer(p.id)}
									>
										<td className="check-cell">
											<input
												type="checkbox"
												checked={isSelected}
												disabled={!isSelected && localXI.size >= 11}
												onChange={() => togglePlayer(p.id)}
												onClick={(e) => e.stopPropagation()}
											/>
										</td>
										<td className="num-cell">{p.number}</td>
										<td className="name-cell">{p.name}</td>
										<td className={`pos-cell pos-${p.position.toLowerCase()}`}>
											{POSITION_LABELS[p.position]}
										</td>
										<td
											className="ovr-cell"
											style={{ color: statColor(p.overall) }}
										>
											{p.overall}
										</td>
										<StatCell value={p.pace} />
										<StatCell value={p.shooting} />
										<StatCell value={p.passing} />
										<StatCell value={p.dribbling} />
										<StatCell value={p.defending} />
										<StatCell value={p.physical} />
										<td className="height-cell">{p.height}</td>
										<td className="age-cell">{p.age}</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>

				<div className="squad-actions">
					<button
						type="button"
						className="btn btn-auto"
						onClick={handleAutoSelect}
					>
						자동 선택
					</button>
					<button
						type="button"
						className="btn btn-squad-reset"
						onClick={handleReset}
					>
						초기화
					</button>
					<button
						type="button"
						className="btn btn-confirm"
						onClick={handleConfirm}
					>
						확인
					</button>
				</div>
			</div>
		</div>
	);
}
