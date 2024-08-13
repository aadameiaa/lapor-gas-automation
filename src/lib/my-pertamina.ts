import { Page } from 'puppeteer'

import {
	LOGIN_ENDPOINT,
	LOGIN_URL,
	USER_DATA_LOCAL_STORAGE_KEY,
	VERIFICATION_NATIONALITY_ID_URL,
} from '@/lib/constants'
import { authDTO } from '@/lib/dto'
import { Auth } from '@/lib/types'
import { delay } from '@/lib/utils'

export async function setupAuth(page: Page, auth: Auth) {
	await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' })
	await page.setCookie(...auth.cookies)
	await page.evaluate(
		async (key, value) => {
			const { revertAuthDTO } = window as any
			window.localStorage.setItem(
				key,
				JSON.stringify(await revertAuthDTO(value)),
			)
		},
		USER_DATA_LOCAL_STORAGE_KEY,
		auth,
	)
}

export async function login(
	page: Page,
	phoneNumber: string,
	pin: string,
): Promise<Auth | number> {
	await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' })
	await delay(3000)

	await page
		.locator('input[placeholder="Email atau No. Handphone"]')
		.fill(phoneNumber)
	await page.locator('input[placeholder="PIN (6-digit)"]').fill(pin)
	await page.locator('button[type="submit"]').click()

	const waitedResponse = await page.waitForResponse(
		(response) =>
			response.url() === LOGIN_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	// 401 - unauthorized and 403 - forbidden
	if (!waitedResponse.ok()) {
		return waitedResponse.status()
	}

	const response = await waitedResponse.json()
	const cookies = await page.cookies()
	return authDTO(response, cookies)
}

export async function logout(page: Page, auth: Auth) {
	await setupAuth(page, auth)
	await page.goto(VERIFICATION_NATIONALITY_ID_URL, {
		waitUntil: 'networkidle2',
	})

	await page.locator('div[data-testid="btnLogout"]').click()
	await page.locator('button[data-testid="btnLogout"][type="button"]').click()
}
