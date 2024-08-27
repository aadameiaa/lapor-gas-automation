import pw from 'playwright'

import { DEFAULT_TIMEOUT } from './constants'
import { revertAuthDTO } from './dto'

export async function initializeBrowser() {
	const browser = await pw.chromium.launch()
	const context = await browser.newContext()
	const page = await context.newPage()

	context.setDefaultTimeout(DEFAULT_TIMEOUT)

	await context.exposeFunction('revertAuthDTO', revertAuthDTO)

	return { browser, context, page }
}
