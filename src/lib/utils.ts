import { readdirSync, statSync } from 'fs'

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

export function getFiles(dir: string, files: string[] = []): string[] {
	const filesInDir = readdirSync(dir)

	for (const file of filesInDir) {
		const name = `${dir}/${file}`

		if (statSync(name).isDirectory()) {
			getFiles(name, files)
		} else {
			files.push(name)
		}
	}

	return files
}
