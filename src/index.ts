import { createBrowser, setupPage } from '@/lib/puppeteer'

const main = async () => {
	const browser = await createBrowser()
	const page = await setupPage(browser)

	await browser.close()
}

main()
