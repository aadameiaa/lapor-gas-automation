import { StatusCodes } from 'http-status-codes'
import { GoToOptions, Page } from 'puppeteer'

import { CustomError } from '../models/custome-error'
import { AddOrderArgs, LoginArgs } from './args'
import {
	LOGIN_ENDPOINT,
	LOGIN_URL,
	MANAGE_PRODUCT_URL,
	PRODUCTS_ENDPOINT,
	PROFILE_ENDPOINT,
	TRANSACTIONS_ENDPOINT,
	USER_DATA_LOCAL_STORAGE_KEY,
	VERIFY_CUSTOMER_ENDPOINT,
	VERIFY_CUSTOMER_URL,
} from './constants'
import { authDTO, customerDTO, orderDTO, productDTO, profileDTO } from './dto'
import { Auth, Customer, CustomerType, Order, Product, Profile } from './types'

async function navigateToLoginPage(
	page: Page,
	{ waitUntil, ...options }: GoToOptions = { waitUntil: 'networkidle0' },
) {
	await page.goto(LOGIN_URL, { waitUntil: waitUntil, ...options })
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
		const status = StatusCodes.UNAUTHORIZED
		throw new CustomError(handleCookieError(status), status)
	}
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
		const status = response.status()
		throw new CustomError(handleLoginError(status), status)
	}

	const body = await response.json()
	const cookies = await page.cookies()
	const auth = authDTO(body, cookies)

	return auth
}

export async function login(
	page: Page,
	{ phoneNumber, pin }: LoginArgs,
): Promise<Auth | CustomError> {
	try {
		await navigateToLoginPage(page)
		await fillLoginForm(page, phoneNumber, pin)
		const auth = await submitLoginForm(page)

		return auth
	} catch (error) {
		return error as CustomError
	}
}

async function navigateToVerifyCustomerPage(
	page: Page,
	{ waitUntil, ...options }: GoToOptions = { waitUntil: 'networkidle0' },
) {
	await page.goto(VERIFY_CUSTOMER_URL, {
		waitUntil: waitUntil,
		...options,
	})
}

async function performLogout(page: Page) {
	await page.locator('div[data-testid="btnLogout"]').click()
	await page.locator('button[data-testid="btnLogout"][type="button"]').click()
}

export async function logout(
	page: Page,
	auth: Auth,
): Promise<null | CustomError> {
	try {
		await setupAuth(page, auth)
		await navigateToVerifyCustomerPage(page)

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		await performLogout(page)

		return null
	} catch (error) {
		return error as CustomError
	}
}

function handleGetProfileError(statusCode?: StatusCodes): string {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
			return 'Your session has expired. Please log in again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

async function fetchProfile(page: Page): Promise<Profile> {
	const response = await page.waitForResponse(
		(response) =>
			response.url() === PROFILE_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		const status = response.status()
		throw new CustomError(handleGetProfileError(status), status)
	}

	const body = await response.json()
	const profile = profileDTO(body)

	return profile
}

export async function getProfile(
	page: Page,
	auth: Auth,
): Promise<Profile | CustomError> {
	try {
		await setupAuth(page, auth)
		await navigateToVerifyCustomerPage(page, { waitUntil: 'load' })

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		const profile = await fetchProfile(page)

		return profile
	} catch (error) {
		return error as CustomError
	}
}

function handleGetProductError(statusCode?: StatusCodes): string {
	switch (statusCode) {
		case StatusCodes.UNAUTHORIZED:
			return 'Your session has expired. Please log in again.'
		default:
			return 'An unexpected error occurred. Please try again later.'
	}
}

async function navigateToManageProductPage(
	page: Page,
	{ waitUntil, ...options }: GoToOptions = { waitUntil: 'networkidle0' },
) {
	await page.goto(MANAGE_PRODUCT_URL, { waitUntil: waitUntil, ...options })
}

async function fetchProduct(page: Page): Promise<Product> {
	const response = await page.waitForResponse(
		(response) =>
			response.url() === PRODUCTS_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		const status = response.status()
		throw new CustomError(handleGetProductError(status), status)
	}

	const body = await response.json()
	const product = productDTO(body)

	return product
}

export async function getProduct(
	page: Page,
	auth: Auth,
): Promise<Product | CustomError> {
	try {
		await setupAuth(page, auth)
		await navigateToManageProductPage(page, { waitUntil: 'load' })

		checkCookieExpiration(page, MANAGE_PRODUCT_URL)

		const product = await fetchProduct(page)

		return product
	} catch (error) {
		return error as CustomError
	}
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
	{ isNeedResponse }: { isNeedResponse?: boolean } = { isNeedResponse: true },
): Promise<Customer | null> {
	await page.locator('button[data-testid="btnCheckNik"][type="submit"]').click()

	if (!isNeedResponse) {
		return null
	}

	const response = await page.waitForResponse(
		(response) =>
			response.url() ===
				`${VERIFY_CUSTOMER_ENDPOINT}?nationalityId=${nationalityId}` &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		const status = response.status()
		throw new CustomError(handleVerifyCustomerError(status), status)
	}

	const body = await response.json()
	const customer = customerDTO(body, nationalityId)

	return customer
}

export async function verifyCustomer(
	page: Page,
	auth: Auth,
	nationalityId: string,
): Promise<Customer | CustomError> {
	try {
		await setupAuth(page, auth)
		await navigateToVerifyCustomerPage(page)

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		await fillVerifyNationalityIdForm(page, nationalityId)
		const customer = (await submitVerifyNationalityIdForm(
			page,
			nationalityId,
		)) as Customer

		return customer
	} catch (error) {
		return error as CustomError
	}
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

	await page.waitForNavigation({ waitUntil: 'networkidle0' })
	await page.waitForNetworkIdle()
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
		const status = StatusCodes.BAD_REQUEST
		throw new CustomError(handleAddOrderError(status), status)
	}

	if (quantity > 1) {
		await page
			.locator('button[data-testid="actionIcon2"]')
			.click({ count: quantity - 1 })
	}
}

async function confirmOrder(page: Page) {
	await page.locator('button[data-testid="btnCheckOrder"]').click()
	await page.waitForNavigation({ waitUntil: 'networkidle0' })
	await page.waitForNetworkIdle()
}

async function submitAddOrderForm(
	page: Page,
	customer: Customer,
	quantity: number,
): Promise<Order> {
	await page.locator('button[data-testid="btnPay"]').click()

	const response = await page.waitForResponse(
		(response) =>
			response.url() === TRANSACTIONS_ENDPOINT &&
			response.request().method() !== 'OPTIONS',
	)

	if (!response.ok()) {
		const status = response.status()
		throw new CustomError(handleAddOrderError(status), status)
	}

	const body = await response.json()
	const order = orderDTO(body, customer, quantity)

	return order
}

export async function addOrder(
	page: Page,
	auth: Auth,
	{ customer, quantity, selectedCustomerType }: AddOrderArgs,
): Promise<Order | CustomError> {
	try {
		await setupAuth(page, auth)
		await navigateToVerifyCustomerPage(page)

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		await fillVerifyNationalityIdForm(page, customer.nationalityId)
		await submitVerifyNationalityIdForm(page, customer.nationalityId, {
			isNeedResponse: false,
		})

		await handleCustomerTypeSelection(
			page,
			customer.types,
			selectedCustomerType,
		)

		await adjustOrderQuantity(page, quantity, customer.quota)
		await confirmOrder(page)
		const order = await submitAddOrderForm(page, customer, quantity)

		return order
	} catch (error) {
		return error as CustomError
	}
}
