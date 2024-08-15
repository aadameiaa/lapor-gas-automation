import fs from 'fs'
import path from 'path'

export function readJSONFile(filename: string) {
	const data = fs.readFileSync(`src/data/${filename}`, { encoding: 'utf-8' })

	return JSON.parse(data)
}

export function writeJSONFile(filename: string, data: any) {
	const dir = 'src/data'
	const filepath = path.join(dir, filename)

	!fs.existsSync(dir) && fs.mkdirSync(dir)
	fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8', (error) => {
		if (error) {
			console.error('Error writing file:', error)
		} else {
			console.log('File has been written')
		}
	})
}

export function deleteJSONFile(filename: string) {
	fs.unlink(`src/data/${filename}`, (error) => {
		if (error) {
			console.error('Error deleting file:', error)
		} else {
			console.log('File has been deleted')
		}
	})
}

export async function delay(duration: number) {
	return new Promise((resolve) => setTimeout(resolve, duration))
}

export function randomIntFromInterval(min: number, max: number) {
	return Math.floor(Math.random() * (max - min + 1) + min)
}
