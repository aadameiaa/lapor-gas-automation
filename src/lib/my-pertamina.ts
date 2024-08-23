import { StatusCodes } from 'http-status-codes'
import { GoToOptions, Page } from 'puppeteer'

import { AddOrderArgs, LoginArgs } from './args'
import {
	LOGIN_ENDPOINT,
	LOGIN_URL,
	MANAGE_PRODUCT_URL,
	PRODUCT_ID,
	PRODUCT_NAME,
	PRODUCTS_ENDPOINT,
	PROFILE_ENDPOINT,
	TRANSACTIONS_ENDPOINT,
	USER_DATA_LOCAL_STORAGE_KEY,
	VERIFY_CUSTOMER_ENDPOINT,
	VERIFY_CUSTOMER_URL,
} from './constants'
import {
	authDTO,
	customerDTO,
	productDTO,
	profileDTO,
	transactionDTO,
} from './dto'
import {
	Auth,
	Customer,
	CustomerType,
	Order,
	Product,
	Profile,
	Transaction,
} from './types'

async function navigateToLoginPage(
	page: Page,
	options: GoToOptions = { waitUntil: 'networkidle0' },
) {
	await page.goto(LOGIN_URL, { waitUntil: options.waitUntil })
}

async function setupAuth(page: Page, auth: Auth) {
	await navigateToLoginPage(page)
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

function handleCookieError(statusCode?: StatusCodes) {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
			return 'Your session has expired. Please log in again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

function checkCookieExpiration(page: Page, url: string) {
	const isRedirected = page.url() !== url

	if (isRedirected) {
		throw new Error(handleCookieError(StatusCodes.UNAUTHORIZED))
	}
}

async function fillLoginForm(page: Page, phoneNumber: string, pin: string) {
	await page
		.locator('input[placeholder="Email atau No. Handphone"]')
		.fill(phoneNumber)
	await page.locator('input[placeholder="PIN (6-digit)"]').fill(pin)
}

async function submitLoginForm(page: Page): Promise<Auth> {
	await page.locator('button[type="submit"]').click()

	const response = await page.waitForResponse(
		(response) =>
			response.url() === LOGIN_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		throw new Error(handleLoginError(response.status()))
	}

	const body = await response.json()
	const cookies = await page.cookies()
	const auth = authDTO(body, cookies)

	return auth
}

function handleLoginError(statusCode?: StatusCodes): string {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
		case StatusCodes.NOT_FOUND:
			return 'Login failed. Please check your phone number or PIN and try again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

export async function login(
	page: Page,
	{ phoneNumber, pin }: LoginArgs,
): Promise<Auth | Error> {
	try {
		await navigateToLoginPage(page)
		await fillLoginForm(page, phoneNumber, pin)
		const auth = await submitLoginForm(page)

		return auth
	} catch (error) {
		return error as Error
	}
}

async function navigateToVerifyCustomerPage(
	page: Page,
	options: GoToOptions = { waitUntil: 'networkidle0' },
) {
	await page.goto(VERIFY_CUSTOMER_URL, {
		waitUntil: options.waitUntil,
	})
}

async function performLogout(page: Page) {
	await page.locator('div[data-testid="btnLogout"]').click()
	await page.locator('button[data-testid="btnLogout"][type="button"]').click()
}

export async function logout(page: Page, auth: Auth): Promise<null | Error> {
	try {
		await setupAuth(page, auth)
		await navigateToVerifyCustomerPage(page)

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		await performLogout(page)

		return null
	} catch (error) {
		return error as Error
	}
}

async function fetchProfile(page: Page): Promise<Profile> {
	const response = await page.waitForResponse(
		(response) =>
			response.url() === PROFILE_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		throw new Error(handleGetProfileError(response.status()))
	}

	const body = await response.json()
	const profile = profileDTO(body)

	return profile
}

function handleGetProfileError(statusCode?: StatusCodes): string {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
			return 'Your session has expired. Please log in again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

export async function getProfile(
	page: Page,
	auth: Auth,
): Promise<Profile | Error> {
	try {
		await setupAuth(page, auth)
		await navigateToVerifyCustomerPage(page, { waitUntil: 'load' })

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		const profile = await fetchProfile(page)

		return profile
	} catch (error) {
		return error as Error
	}
}

async function navigateToManageProductPage(
	page: Page,
	options: GoToOptions = { waitUntil: 'networkidle0' },
) {
	await page.goto(MANAGE_PRODUCT_URL, { waitUntil: options.waitUntil })
}

async function fetchProduct(page: Page): Promise<Product> {
	const response = await page.waitForResponse(
		(response) =>
			response.url() === PRODUCTS_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		throw new Error(handleGetProductError(response.status()))
	}

	const body = await response.json()
	const product = productDTO(body)

	return product
}

function handleGetProductError(statusCode?: StatusCodes): string {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
			return 'Your session has expired. Please log in again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

export async function getProduct(
	page: Page,
	auth: Auth,
): Promise<Product | Error> {
	try {
		await setupAuth(page, auth)
		await navigateToManageProductPage(page, { waitUntil: 'load' })

		checkCookieExpiration(page, MANAGE_PRODUCT_URL)

		const product = await fetchProduct(page)

		return product
	} catch (error) {
		return error as Error
	}
}

async function fillVerifyNationalityIdForm(page: Page, nationalityId: string) {
	await page
		.locator(
			'input[type="search"][placeholder="Masukkan 16 digit NIK KTP Pelanggan"]',
		)
		.fill(nationalityId)
}

async function submitVerifyNationalityIdForm(
	page: Page,
	nationalityId: string,
): Promise<Customer> {
	await page.locator('button[data-testid="btnCheckNik"][type="submit"]').click()

	const response = await page.waitForResponse(
		(response) =>
			response.url() ===
				`${VERIFY_CUSTOMER_ENDPOINT}?nationalityId=${nationalityId}` &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		throw new Error(handleVerifyCustomerError(response.status()))
	}

	const body = await response.json()
	const customer = customerDTO(body, nationalityId)

	return customer
}

function handleVerifyCustomerError(statusCode?: StatusCodes): string {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
			return 'Your session has expired. Please log in again.'
		case StatusCodes.BAD_REQUEST:
			return 'The Nationality ID is not valid. Please ensure your information is correct and try again.'
		case StatusCodes.NOT_FOUND:
			return 'Customer data not found. Please verify your details and try again.'
		case StatusCodes.TOO_MANY_REQUESTS:
			return 'You’ve made too many requests in a short time. Please wait 1 minute before trying again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

export async function verifyCustomer(
	page: Page,
	auth: Auth,
	nationalityId: string,
): Promise<Customer | Error> {
	try {
		await setupAuth(page, auth)
		await navigateToVerifyCustomerPage(page)

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		await fillVerifyNationalityIdForm(page, nationalityId)
		const customer = await submitVerifyNationalityIdForm(page, nationalityId)

		return customer
	} catch (error) {
		return error as Error
	}
}

async function handleCustomerTypeSelection(
	page: Page,
	customerTypes: CustomerType[],
	selectedCustomerType?: CustomerType,
) {
	if (customerTypes.length === 2) {
		await page
			.locator(`input[type="radio"][value="${selectedCustomerType}"]`)
			.click()
		await page.locator('button[data-testid="btnContinueTrx"]').click()
	}
}

function isValidOrderQuantity(quantity: number, quota: number): boolean {
	return quantity >= 1 && quantity <= 20 && quantity <= quota
}

async function adjustOrderQuantity(
	page: Page,
	quantity: number,
	quota: number,
) {
	if (!isValidOrderQuantity(quantity, quota)) {
		throw new Error(handleAddOrderError(StatusCodes.BAD_REQUEST))
	}

	quantity > 1 &&
		(await page
			.locator('button[data-testid="actionIcon2"]')
			.click({ count: quantity - 1 }))
}

async function confirmOrder(page: Page) {
	await page.locator('button[data-testid="btnCheckOrder"]').click()
	await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
}

async function submitAddOrderForm(page: Page): Promise<Transaction> {
	await page.locator('button[data-testid="btnPay"]').click()

	const response = await page.waitForResponse(
		(response) =>
			response.url() === TRANSACTIONS_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		throw new Error(handleAddOrderError(response.status()))
	}

	const body = await response.json()
	const transaction = transactionDTO(body)

	return transaction
}

function handleAddOrderError(statusCode?: StatusCodes): string {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
			return 'Your session has expired. Please log in again.'
		case StatusCodes.BAD_REQUEST:
			return 'The quantity you entered exceeds the available stock. Please adjust the quantity and try again.'
		case StatusCodes.TOO_MANY_REQUESTS:
			return 'You’ve made too many requests in a short time. Please wait 1 minute before trying again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

export async function addOrder(
	page: Page,
	{ customer, quantity, selectedCustomerType }: AddOrderArgs,
): Promise<Order | Error> {
	try {
		await handleCustomerTypeSelection(
			page,
			customer.types,
			selectedCustomerType,
		)

		await adjustOrderQuantity(page, quantity, customer.quota)
		await confirmOrder(page)
		const transaction = await submitAddOrderForm(page)

		const order: Order = {
			orderId: transaction.id,
			customer: {
				nationalityId: customer.nationalityId,
				name: customer.name,
				quota: customer.quota - quantity,
			},
			product: {
				id: PRODUCT_ID,
				name: PRODUCT_NAME,
				quantity,
			},
		}

		return order
	} catch (error) {
		return error as Error
	}
}
