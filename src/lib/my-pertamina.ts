import { StatusCodes } from 'http-status-codes'
import { HTTPResponse, Page } from 'puppeteer'

import {
	LOGIN_ENDPOINT,
	LOGIN_URL,
	MY_PERTAMINA_DELAY,
	USER_DATA_LOCAL_STORAGE_KEY,
	VERIFY_CUSTOMER_ENDPOINT,
	VERIFY_CUSTOMER_URL,
} from '@/lib/constants'
import { authDTO, customerDTO } from '@/lib/dto'
import { Auth, Customer, Order, Person } from '@/lib/types'
import { delay, deleteJSONFile, writeJSONFile } from '@/lib/utils'

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

export function checkCookieExpiration(page: Page, url: string) {
	const isRedirected = page.url() !== url

	return isRedirected ? StatusCodes.UNAUTHORIZED : null
}

export async function login(
	page: Page,
	phoneNumber: string,
	pin: string,
): Promise<null | StatusCodes> {
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
	if (!waitedResponse.ok()) {
		return waitedResponse.status()
	}

	const response = await waitedResponse.json()
	const cookies = await page.cookies()
	const auth = authDTO(response, cookies)

	writeJSONFile('auth.json', auth)

	return null
}

export async function logout(
	page: Page,
	auth: Auth,
): Promise<null | StatusCodes> {
	await setupAuth(page, auth)
	await page.goto(VERIFY_CUSTOMER_URL, {
		waitUntil: 'networkidle2',
	})

	const cookieStatus = checkCookieExpiration(page, VERIFY_CUSTOMER_URL)
	if (cookieStatus !== null) {
		return cookieStatus
	}

	await page.locator('div[data-testid="btnLogout"]').click()
	await page.locator('button[data-testid="btnLogout"][type="button"]').click()

	deleteJSONFile('auth.json')

	return null
}

async function verifyNationalityId(
	page: Page,
	nationalityId: Person['nationalityId'],
): Promise<HTTPResponse> {
	await page
		.locator(
			'input[type="search"][placeholder="Masukkan 16 digit NIK KTP Pelanggan"]',
		)
		.fill(nationalityId)
	await page.locator('button[data-testid="btnCheckNik"][type="submit"]').click()

	const waitedResponse = await page.waitForResponse(
		(response) =>
			response.url() ===
				`${VERIFY_CUSTOMER_ENDPOINT}?nationalityId=${nationalityId}` &&
			response.request().method() !== 'OPTIONS',
	)

	return waitedResponse
}

export async function verifyCustomer(
	page: Page,
	auth: Auth,
	nationalityId: Person['nationalityId'],
): Promise<null | StatusCodes> {
	await setupAuth(page, auth)
	await page.goto(VERIFY_CUSTOMER_URL, {
		waitUntil: 'networkidle2',
	})

	const cookieStatus = checkCookieExpiration(page, VERIFY_CUSTOMER_URL)
	if (cookieStatus !== null) {
		return cookieStatus
	}

	const verifyResponse = await verifyNationalityId(page, nationalityId)
	if (!verifyResponse.ok()) {
		return verifyResponse.status()
	}

	const response = await verifyResponse.json()
	const customer = customerDTO(response, nationalityId)

	writeJSONFile('customer.json', customer)

	return null
}

export async function verifyCustomers(
	page: Page,
	auth: Auth,
	nationalityIds: string[],
): Promise<null | StatusCodes> {
	await setupAuth(page, auth)
	await page.goto(VERIFY_CUSTOMER_URL, {
		waitUntil: 'networkidle2',
	})

	const cookieStatus = checkCookieExpiration(page, VERIFY_CUSTOMER_URL)
	if (cookieStatus !== null) {
		return cookieStatus
	}

	let customers: Customer[] = []
	for (let index = 0; index < nationalityIds.length; index++) {
		const nationalityId = nationalityIds[index]

		const verifyResponse = await verifyNationalityId(page, nationalityId)
		if (!verifyResponse.ok()) {
			console.log(
				`${index} verify customer ${nationalityId} have status code: ${verifyResponse.status()}`,
			)

			if (verifyResponse.status() === StatusCodes.TOO_MANY_REQUESTS) {
				index--
				await delay(MY_PERTAMINA_DELAY)
			}

			await page.goto(VERIFY_CUSTOMER_URL, { waitUntil: 'networkidle2' })

			continue
		}

		const response = await verifyResponse.json()
		const customer = customerDTO(response, nationalityId)

		customers = [...customers, customer]

		await page.goto(VERIFY_CUSTOMER_URL, { waitUntil: 'networkidle2' })
	}

	writeJSONFile('customers.json', customers)

	return null
}

export async function addOrder(
	page: Page,
	auth: Auth,
	order: Order,
): Promise<null | StatusCodes> {
	await setupAuth(page, auth)
	await page.goto(VERIFY_CUSTOMER_URL, {
		waitUntil: 'networkidle2',
	})

	const cookieStatus = checkCookieExpiration(page, VERIFY_CUSTOMER_URL)
	if (cookieStatus !== null) {
		return cookieStatus
	}

	const verifyResponse = await verifyNationalityId(page, order.nationalityId)
	if (!verifyResponse.status()) {
		return verifyResponse.status()
	}
	await page.waitForNavigation({ waitUntil: 'networkidle2' })

	order.quantity > 1 &&
		(await page
			.locator('button[data-testid="actionIcon2"]')
			.click({ count: order.quantity - 1 }))
	await page.locator('button[data-testid="btnCheckOrder"]').click()
	await page.waitForNavigation({ waitUntil: 'networkidle2' })

	await page.locator('button[data-testid="btnPay"]').click()
	await page.waitForNavigation({ waitUntil: 'networkidle2' })

	writeJSONFile('order.json', order)

	return null
}
