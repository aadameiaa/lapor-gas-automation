import { Customer, Order } from '@/lib/types'

export async function delay(duration: number) {
	return new Promise((resolve) => setTimeout(resolve, duration))
}

export function randomIntFromInterval(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}

export function rupiah(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
	})
		.format(value)
		.slice(0, -3)
}

export function isValidOrderQuantity(
	{ quantity }: Order,
	customer: Customer,
): boolean {
	return (
		quantity >= 1 &&
		quantity <= 20 &&
		quantity <= customer.quotaRemaining.thisMonth.parent
	)
}
