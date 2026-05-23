import { describe, expect, it } from 'bun:test'
import { buildAnimatedSectionMotionProps } from '@/components/public/AnimatedSection'

describe('AnimatedSection motion props', () => {
	it('disables reveal animation when reduced motion is preferred', () => {
		expect(buildAnimatedSectionMotionProps(true)).toEqual({
			initial: false,
			transition: undefined,
			viewport: undefined,
			whileInView: undefined,
		})
	})

	it('keeps the reveal animation config when reduced motion preference is unknown', () => {
		const motionProps = buildAnimatedSectionMotionProps(null)

		expect(motionProps.initial).toEqual({ opacity: 0, y: 24 })
		expect(motionProps.whileInView).toEqual({ opacity: 1, y: 0 })
		expect(motionProps.viewport).toEqual({ amount: 0.2, once: true })
		expect(motionProps.transition).toEqual({
			duration: 0.45,
			ease: [0.22, 1, 0.36, 1],
		})
	})

	it('keeps the reveal animation config when reduced motion is off', () => {
		const motionProps = buildAnimatedSectionMotionProps(false)

		expect(motionProps.initial).toEqual({ opacity: 0, y: 24 })
		expect(motionProps.whileInView).toEqual({ opacity: 1, y: 0 })
		expect(motionProps.viewport).toEqual({ amount: 0.2, once: true })
		expect(motionProps.transition).toEqual({
			duration: 0.45,
			ease: [0.22, 1, 0.36, 1],
		})
	})

})
