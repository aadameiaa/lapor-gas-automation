import puppeteer, { Browser } from 'puppeteer'

import { DEFAULT_PUPPETEER_TIMEOUT } from './constants'
import { revertAuthDTO } from './dto'

export async function createBrowser() {
	return await puppeteer.launch({
		headless: 'shell',
		defaultViewport: null,
		devtools: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox'],
	})
}

export async function setupPage(browser: Browser) {
	const [page] = await browser.pages()

	page.setDefaultNavigationTimeout(DEFAULT_PUPPETEER_TIMEOUT)
	page.setDefaultTimeout(DEFAULT_PUPPETEER_TIMEOUT)

	await page.exposeFunction('revertAuthDTO', revertAuthDTO)

	return page
}
