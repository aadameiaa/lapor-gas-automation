import { config } from 'dotenv'

import { createBrowser, setupPage } from '@/lib/puppeteer'

config()

const main = async () => {
	const { PHONE_NUMBER, PIN } = process.env

	const browser = await createBrowser()
	const page = await setupPage(browser)

	await browser.close()
}

main()
