declare module "bun:test" {
	type TestCallback = () => void | Promise<void>;

	interface Matchers {
		toBe(expected: unknown): void;
		toEqual(expected: unknown): void;
		toContain(expected: string): void;
		toBeDefined(): void;
		toBeNull(): void;
		toBeGreaterThan(expected: number): void;
		toBeGreaterThanOrEqual(expected: number): void;
		toBeString(): void;
		toBeWithin(min: number, max: number): void;
		toMatch(expected: string | RegExp): void;
		toHaveProperty(key: string, value?: unknown): void;
		not: {
			toBe(expected: unknown): void;
			toContain(expected: string): void;
			toBeNull(): void;
			toBe(expected: unknown): void;
			toMatch(expected: string | RegExp): void;
		};
	}

	export function describe(name: string, callback: TestCallback): void;
	export function it(name: string, callback: TestCallback): void;
	export function test(name: string, callback: TestCallback): void;
	export function beforeAll(callback: TestCallback): void;
	export function expect<T = unknown>(actual: T): Matchers;
}
