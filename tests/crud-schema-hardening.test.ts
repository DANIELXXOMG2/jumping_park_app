import { describe, expect, it } from 'bun:test'
import { usuarioCreateSchema } from '@/lib/schemas/crud.schema'

const validUserInput = {
	uid: '12345678',
	fullName: 'Ada Lovelace',
	email: 'ada@example.com',
	phone: '3001234567',
	address: 'Calle 123',
}

describe('crud schema hardening', () => {
	it('rejects malformed minors when creating direct user records', () => {
		const result = usuarioCreateSchema.safeParse({
			...validUserInput,
			minors: [{ unexpected: 'value' }],
		})

		expect(result.success).toBe(false)
	})

	it('accepts fully shaped minors for direct user creation', () => {
		const result = usuarioCreateSchema.safeParse({
			...validUserInput,
			minors: [
				{
					firstName: 'Augusta',
					lastName: 'King',
					birthDate: '2016-05-01',
					eps: 'Sura',
					idType: 'ti',
					idNumber: 'TI12345',
					relationship: 'hijo',
				},
			],
		})

		expect(result.success).toBe(true)
		if (!result.success) {
			throw new Error('Expected a valid direct user payload with typed minors')
		}

		expect(result.data.minors.length).toBe(1)
		expect(result.data.minors[0]?.idNumber).toBe('TI12345')
	})
})
