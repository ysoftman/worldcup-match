import { useEffect, useRef, useState } from "react";
import { playGoal } from "../utils/sounds";

interface AnimatedScoreProps {
	target: number;
	active: boolean;
	className?: string;
}

/**
 * 경기 진행 시 골이 0에서 1씩 올라가는 애니메이션 + 골 사운드
 * - active가 false → true로 전환될 때만 애니메이션 실행
 * - 이미 played 상태로 마운트되면 최종 점수 바로 표시
 */
export function AnimatedScore({
	target,
	active,
	className,
}: AnimatedScoreProps) {
	const wasActive = useRef(active);
	const [display, setDisplay] = useState(active ? target : 0);
	const [ticking, setTicking] = useState(false);

	useEffect(() => {
		if (active && !wasActive.current) {
			wasActive.current = true;
			setTicking(true);

			if (target <= 0) {
				setDisplay(0);
				setTimeout(() => setTicking(false), 300);
				return;
			}

			setDisplay(0);
			let count = 0;
			const timer = setInterval(() => {
				count++;
				setDisplay(count);
				playGoal();
				if (count >= target) {
					clearInterval(timer);
					setTimeout(() => setTicking(false), 400);
				}
			}, 450);
			return () => clearInterval(timer);
		}
		wasActive.current = active;
	}, [active, target]);

	if (!active) {
		return <span className={className}>-</span>;
	}

	return (
		<span
			key={ticking ? `t-${display}` : "done"}
			className={`${className || ""} ${ticking ? "goal-tick" : ""}`}
		>
			{display}
		</span>
	);
}
