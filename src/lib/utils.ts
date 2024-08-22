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
