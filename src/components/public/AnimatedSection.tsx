"use client";

import { motion, type HTMLMotionProps, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedSectionProps extends HTMLMotionProps<"div"> {
	children: ReactNode;
	sectionId: string;
}

type AnimatedSectionMotionProps = Pick<
	HTMLMotionProps<"div">,
	"initial" | "transition" | "viewport" | "whileInView"
>;

const DEFAULT_TRANSITION = {
	duration: 0.45,
	ease: [0.22, 1, 0.36, 1],
} as const;

const DEFAULT_VIEWPORT = {
	once: true,
	amount: 0.2,
} as const;

export function buildAnimatedSectionMotionProps(
	prefersReducedMotion: boolean | null,
	transition?: AnimatedSectionProps["transition"],
	viewport?: AnimatedSectionProps["viewport"],
): AnimatedSectionMotionProps {
	if (prefersReducedMotion === true) {
		return {
			initial: false,
			transition: undefined,
			viewport: undefined,
			whileInView: undefined,
		};
	}

	return {
		initial: { opacity: 0, y: 24 },
		transition: transition ?? DEFAULT_TRANSITION,
		viewport: { ...DEFAULT_VIEWPORT, ...viewport },
		whileInView: { opacity: 1, y: 0 },
	};
}

export function AnimatedSection({
	children,
	sectionId,
	transition,
	viewport,
	...props
}: AnimatedSectionProps) {
	const prefersReducedMotion = useReducedMotion();
	const motionProps = buildAnimatedSectionMotionProps(
		prefersReducedMotion,
		transition,
		viewport,
	);

	return (
		<motion.div data-animated-section={sectionId} {...props} {...motionProps}>
			{children}
		</motion.div>
	);
}
