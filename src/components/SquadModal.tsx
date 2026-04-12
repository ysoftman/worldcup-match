import { useEffect, useMemo, useRef, useState } from "react";
import type { Country } from "../data/countries";
import type { Position } from "../types";
import { POSITION_LABELS } from "../types";
import { autoSelectXI, getSquad, hasRealPlayers } from "../utils/playerLoader";

interface SquadModalProps {
	team: Country;
	formationId: string;
	selectedXI: Set<number>;
	onChangeXI: (teamCode: string, xi: Set<number>) => void;
	onClose: () => void;
	readOnly?: boolean;
}

const POSITION_ORDER: Position[] = ["GK", "DEF", "MID", "FWD"];

type SortKey =
	| "number"
	| "name"
	| "position"
	| "overall"
	| "pace"
	| "shooting"
	| "passing"
	| "dribbling"
	| "defending"
	| "physical"
	| "height"
	| "age";
type SortDir = "asc" | "desc";
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
	readOnly = false,
}: SquadModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const [filter, setFilter] = useState<Position | "ALL">("ALL");
	const [localXI, setLocalXI] = useState<Set<number>>(() => {
		if (selectedXI.size > 0) return new Set(selectedXI);
		return new Set<number>();
	});
	const [zoomPhoto, setZoomPhoto] = useState<{
		src: string;
		name: string;
	} | null>(null);
	const [sortKey, setSortKey] = useState<SortKey | null>(null);
	const [sortDir, setSortDir] = useState<SortDir>("desc");

	const squad = useMemo(() => getSquad(team), [team]);
	const isReal = hasRealPlayers(team.code);

	// 선택된 XI가 없으면 자동 선택 후 저장
	useEffect(() => {
		if (selectedXI.size === 0 && squad.length > 0) {
			const auto = autoSelectXI(squad, formationId);
			setLocalXI(auto);
			onChangeXI(team.code, auto);
		}
	}, [selectedXI.size, squad, formationId, team.code, onChangeXI]);

	// 모달 열릴 때 포커스 이동
	useEffect(() => {
		const firstBtn = modalRef.current?.querySelector<HTMLElement>("button");
		firstBtn?.focus();
	}, []);

	// 외부 클릭으로 닫기 (사진 확대 중이면 사진만 닫기)
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
				if (zoomPhoto) {
					setZoomPhoto(null);
				} else {
					onClose();
				}
			}
		};
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [onClose, zoomPhoto]);

	// ESC로 닫기 (사진 확대 중이면 사진만 닫기)
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				if (zoomPhoto) {
					setZoomPhoto(null);
				} else {
					onClose();
				}
			}
		};
		document.addEventListener("keydown", handleKey);
		return () => document.removeEventListener("keydown", handleKey);
	}, [onClose, zoomPhoto]);

	const togglePlayer = (playerId: number) => {
		if (readOnly) return;
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

	const toggleSort = (key: SortKey) => {
		if (sortKey === key) {
			setSortDir((d) => (d === "desc" ? "asc" : "desc"));
		} else {
			setSortKey(key);
			setSortDir("desc");
		}
	};

	// 포지션별 필터링
	const filtered =
		filter === "ALL" ? squad : squad.filter((p) => p.position === filter);

	// 정렬: 사용자 선택 컬럼 우선, 기본은 포지션 → OVR 내림차순
	const sorted = [...filtered].sort((a, b) => {
		if (sortKey) {
			const dir = sortDir === "desc" ? -1 : 1;
			if (sortKey === "name") {
				return dir * -a.name.localeCompare(b.name);
			}
			if (sortKey === "position") {
				const diff =
					POSITION_ORDER.indexOf(a.position) -
					POSITION_ORDER.indexOf(b.position);
				return diff !== 0 ? dir * -diff : b.overall - a.overall;
			}
			return dir * -(a[sortKey] - b[sortKey]);
		}
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
		<div
			className="squad-overlay"
			role="dialog"
			aria-modal="true"
			aria-labelledby="squad-title"
		>
			<div className="squad-modal" ref={modalRef}>
				<div className="squad-header">
					<h3 id="squad-title">
						{team.flag} {team.nameKo} 스쿼드
					</h3>
					<span className="squad-avg">팀 평균 OVR: {avgOverall}</span>
					<button
						type="button"
						className="squad-close"
						onClick={onClose}
						aria-label="모달 닫기"
					>
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
					{!isReal && (
						<span className="xi-legend">
							<span className="name-generated">*</span>가상 선수
						</span>
					)}
				</div>

				<fieldset className="squad-filters" aria-label="포지션 필터">
					{POSITION_FILTERS.map((f) => (
						<button
							key={f.value}
							type="button"
							className={`squad-filter ${filter === f.value ? "active" : ""}`}
							onClick={() => setFilter(f.value)}
							aria-pressed={filter === f.value}
						>
							{f.label}
						</button>
					))}
				</fieldset>

				<div className="squad-table-wrap">
					<table className="squad-table">
						<thead>
							<tr>
								{!readOnly && <th className="th-check">선발</th>}
								<th
									className="th-num th-sortable"
									onClick={() => toggleSort("number")}
								>
									#
									{sortKey === "number"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-name th-sortable"
									onClick={() => toggleSort("name")}
								>
									이름
									{sortKey === "name" ? (sortDir === "desc" ? " ▼" : " ▲") : ""}
								</th>
								<th
									className="th-pos th-sortable"
									onClick={() => toggleSort("position")}
								>
									포지션
									{sortKey === "position"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-ovr th-sortable"
									onClick={() => toggleSort("overall")}
								>
									OVR
									{sortKey === "overall"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-stat th-sortable"
									onClick={() => toggleSort("pace")}
								>
									속도
									{sortKey === "pace" ? (sortDir === "desc" ? " ▼" : " ▲") : ""}
								</th>
								<th
									className="th-stat th-sortable"
									onClick={() => toggleSort("shooting")}
								>
									슈팅
									{sortKey === "shooting"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-stat th-sortable"
									onClick={() => toggleSort("passing")}
								>
									패스
									{sortKey === "passing"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-stat th-sortable"
									onClick={() => toggleSort("dribbling")}
								>
									드리블
									{sortKey === "dribbling"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-stat th-sortable"
									onClick={() => toggleSort("defending")}
								>
									수비
									{sortKey === "defending"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-stat th-sortable"
									onClick={() => toggleSort("physical")}
								>
									체력
									{sortKey === "physical"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-height th-sortable"
									onClick={() => toggleSort("height")}
								>
									키
									{sortKey === "height"
										? sortDir === "desc"
											? " ▼"
											: " ▲"
										: ""}
								</th>
								<th
									className="th-age th-sortable"
									onClick={() => toggleSort("age")}
								>
									나이
									{sortKey === "age" ? (sortDir === "desc" ? " ▼" : " ▲") : ""}
								</th>
							</tr>
						</thead>
						<tbody>
							{sorted.map((p) => {
								const isSelected = localXI.has(p.id);
								return (
									<tr
										key={p.id}
										className={`squad-row ${isSelected ? "selected-row" : ""}`}
										onClick={readOnly ? undefined : () => togglePlayer(p.id)}
									>
										{!readOnly && (
											<td className="check-cell">
												<input
													type="checkbox"
													checked={isSelected}
													disabled={!isSelected && localXI.size >= 11}
													onChange={() => togglePlayer(p.id)}
													onClick={(e) => e.stopPropagation()}
												/>
											</td>
										)}
										<td className="num-cell">{p.number}</td>
										<td className="name-cell">
											{p.photo && (
												<img
													className="player-photo"
													src={p.photo}
													alt={p.name}
													loading="lazy"
													onClick={(e) => {
														e.stopPropagation();
														setZoomPhoto({ src: p.photo!, name: p.name });
													}}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.stopPropagation();
															setZoomPhoto({ src: p.photo!, name: p.name });
														}
													}}
												/>
											)}
											{p.photo ? (
												<button
													type="button"
													className="name-clickable"
													onClick={(e) => {
														e.stopPropagation();
														setZoomPhoto({ src: p.photo!, name: p.name });
													}}
												>
													{p.name}
												</button>
											) : (
												<span>{p.name}</span>
											)}
											{!isReal && <span className="name-generated">*</span>}
										</td>
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

				{!readOnly && (
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
				)}
			</div>
			{zoomPhoto && (
				<button
					type="button"
					className="photo-zoom-overlay"
					onClick={(e) => {
						e.stopPropagation();
						setZoomPhoto(null);
					}}
					onMouseDown={(e) => e.stopPropagation()}
				>
					<div className="photo-zoom-card">
						<img src={zoomPhoto.src} alt={zoomPhoto.name} />
						<span className="photo-zoom-name">{zoomPhoto.name}</span>
					</div>
				</button>
			)}
		</div>
	);
}
