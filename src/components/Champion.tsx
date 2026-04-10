import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";
import type { Country } from "../data/countries";
import type { TeamStats } from "../types";

interface ChampionProps {
	team: Country;
	stats: TeamStats | undefined;
}

function fireConfetti() {
	const duration = 4000;
	const end = Date.now() + duration;

	// 중앙 폭죽
	confetti({
		particleCount: 150,
		spread: 100,
		origin: { y: 0.6 },
		colors: ["#d4ac0d", "#f1c40f", "#e67e22", "#e74c3c", "#3498db", "#2ecc71"],
	});

	// 좌우에서 연속 발사
	const interval = setInterval(() => {
		if (Date.now() > end) {
			clearInterval(interval);
			return;
		}

		// 왼쪽
		confetti({
			particleCount: 40,
			angle: 60,
			spread: 55,
			origin: { x: 0, y: 0.7 },
			colors: ["#d4ac0d", "#f1c40f", "#e67e22"],
		});

		// 오른쪽
		confetti({
			particleCount: 40,
			angle: 120,
			spread: 55,
			origin: { x: 1, y: 0.7 },
			colors: ["#e74c3c", "#3498db", "#2ecc71"],
		});
	}, 300);

	// 별 모양 발사
	setTimeout(() => {
		confetti({
			particleCount: 80,
			spread: 360,
			ticks: 100,
			gravity: 0.3,
			decay: 0.94,
			startVelocity: 30,
			shapes: ["star"],
			colors: ["#FFD700", "#FFA500", "#FF6347"],
			origin: { x: 0.5, y: 0.3 },
		});
	}, 800);

	// 마지막 대형 폭발
	setTimeout(() => {
		confetti({
			particleCount: 200,
			spread: 160,
			origin: { y: 0.35 },
			colors: [
				"#d4ac0d",
				"#f1c40f",
				"#e67e22",
				"#e74c3c",
				"#3498db",
				"#2ecc71",
				"#9b59b6",
			],
			startVelocity: 45,
			gravity: 0.8,
		});
	}, 2000);
}

export function Champion({ team, stats }: ChampionProps) {
	const fired = useRef(false);

	useEffect(() => {
		if (!fired.current) {
			fired.current = true;
			fireConfetti();
		}
	}, []);

	return (
		<div className="champion-wrapper">
			{/* 빛나는 배경 링 */}
			<div className="champion-rings">
				<div className="ring ring-1" />
				<div className="ring ring-2" />
				<div className="ring ring-3" />
			</div>

			{/* 떨어지는 별 파티클 */}
			<div className="star-field">
				{Array.from({ length: 20 }).map((_, i) => (
					<div
						key={`star-${
							// biome-ignore lint/suspicious/noArrayIndexKey: 고정 장식 요소
							i
						}`}
						className="falling-star"
						style={{
							left: `${Math.random() * 100}%`,
							animationDelay: `${Math.random() * 3}s`,
							animationDuration: `${2 + Math.random() * 3}s`,
						}}
					/>
				))}
			</div>

			<div className="champion">
				<div className="trophy-container">
					<div className="trophy-glow" />
					<div className="trophy">🏆</div>
				</div>
				<div className="champion-flag-container">
					<div className="champion-flag">{team.flag}</div>
				</div>
				<h2 className="champion-name">
					{team.nameKo}({team.name})
				</h2>
				<p className="champion-rank">FIFA 랭킹 #{team.rank}</p>
				<p className="champion-label">월드컵 우승</p>
				{stats && (
					<p className="champion-stats">
						{stats.played}경기 {stats.wins}승 {stats.draws}무 {stats.losses}패
						(승률 {stats.winRate}%)
					</p>
				)}
			</div>
		</div>
	);
}
