import { StatusCodes } from 'http-status-codes'
import { BrowserContext, Page } from 'playwright'

import { CustomError } from '../models/custom-error'
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
	options?: Parameters<typeof page.goto>[1],
) {
	await page.goto(LOGIN_URL, options)
}

async function setupAuth(context: BrowserContext, page: Page, auth: Auth) {
	await navigateToLoginPage(page, { waitUntil: 'networkidle' })
	await context.addCookies(auth.cookies)
	await page.evaluate(
		async ({ key, value }) => {
			const { revertAuthDTO } = window as any

			window.localStorage.setItem(
				key,
				JSON.stringify(await revertAuthDTO(value)),
			)
		},
		{ key: USER_DATA_LOCAL_STORAGE_KEY, value: auth },
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

async function fillLoginForm(page: Page, { phoneNumber, pin }: LoginArgs) {
	await page.getByPlaceholder('Email atau No. Handphone').fill(phoneNumber)
	await page.getByPlaceholder('PIN (6-digit)').fill(pin)
}

async function submitLoginForm(
	context: BrowserContext,
	page: Page,
): Promise<Auth> {
	await page.getByText('Masuk').click()

	const response = await page.waitForResponse(
		(response) =>
			response.url() === LOGIN_ENDPOINT &&
			response.request().method() === 'POST',
	)

	if (!response.ok()) {
		const status = response.status()
		throw new CustomError(handleLoginError(status), status)
	}

	const body = await response.json()
	const cookies = await context.cookies(LOGIN_URL)
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
	context: BrowserContext,
	page: Page,
	{ phoneNumber, pin }: LoginArgs,
) {
	try {
		await navigateToLoginPage(page, { waitUntil: 'networkidle' })
		await fillLoginForm(page, { phoneNumber, pin })
		const auth = await submitLoginForm(context, page)

		return auth
	} catch (error) {
		return error as CustomError
	}
}

async function navigateToVerifyCustomerPage(
	page: Page,
	options?: Parameters<typeof page.goto>[1],
) {
	await page.goto(VERIFY_CUSTOMER_URL, options)
}

async function performLogout(page: Page) {
	await page.getByTestId('btnLogout').click()
	await page.getByRole('dialog').getByTestId('btnLogout').click()
}

export async function logout(
	context: BrowserContext,
	page: Page,
	auth: Auth,
): Promise<null | CustomError> {
	try {
		await setupAuth(context, page, auth)
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
			response.request().method() === 'GET',
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
	context: BrowserContext,
	page: Page,
	auth: Auth,
): Promise<Profile | CustomError> {
	try {
		await setupAuth(context, page, auth)
		await navigateToVerifyCustomerPage(page)

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
	options?: Parameters<typeof page.goto>[1],
) {
	await page.goto(MANAGE_PRODUCT_URL, options)
}

async function fetchProduct(page: Page): Promise<Product> {
	const response = await page.waitForResponse(
		(response) =>
			response.url() === PRODUCTS_ENDPOINT &&
			response.request().method() === 'GET',
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
	context: BrowserContext,
	page: Page,
	auth: Auth,
): Promise<Product | CustomError> {
	try {
		await setupAuth(context, page, auth)
		await navigateToManageProductPage(page)

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
		.getByPlaceholder('Masukkan 16 digit NIK KTP Pelanggan')
		.fill(nationalityId)
}

async function submitVerifyNationalityIdForm(
	page: Page,
	nationalityId: string,
): Promise<Customer | null> {
	await page.getByTestId('btnCheckNik').click()

	const response = await page.waitForResponse(
		(response) =>
			response.url() ===
				`${VERIFY_CUSTOMER_ENDPOINT}?nationalityId=${nationalityId}` &&
			response.request().method() === 'GET',
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
	context: BrowserContext,
	page: Page,
	auth: Auth,
	nationalityId: string,
): Promise<Customer | CustomError> {
	try {
		await setupAuth(context, page, auth)
		await navigateToVerifyCustomerPage(page, { waitUntil: 'networkidle' })

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
		await page.getByLabel(selectedCustomerType as string).click()
		await page.getByTestId('btnContinueTrx').click()
	}
}

async function preparingCustomer(
	page: Page,
	customer: Customer,
	selectedCustomerType?: CustomerType,
) {
	const productResponsePromise = page.waitForResponse(
		(response) =>
			response.url() === PRODUCTS_ENDPOINT &&
			response.request().method() === 'GET' &&
			response.status() === StatusCodes.OK,
	)

	const profileResponsePromise = page.waitForResponse(
		(response) =>
			response.url() === PROFILE_ENDPOINT &&
			response.request().method() === 'GET' &&
			response.status() === StatusCodes.OK,
	)

	await fillVerifyNationalityIdForm(page, customer.nationalityId)
	await submitVerifyNationalityIdForm(page, customer.nationalityId)

	await handleCustomerTypeSelection(page, customer.types, selectedCustomerType)

	const productResponse = await productResponsePromise
	await profileResponsePromise

	const productBody = await productResponse.json()
	const product = productDTO(productBody)

	if (product.stock.available === 0) {
		throw new CustomError(
			handleAddOrderError(StatusCodes.BAD_REQUEST),
			StatusCodes.BAD_REQUEST,
		)
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
		const status = StatusCodes.BAD_REQUEST
		throw new CustomError(handleAddOrderError(status), status)
	}

	if (quantity > 1) {
		await page.getByTestId('actionIcon2').click({ clickCount: quantity - 1 })
	}
}

async function confirmOrder(page: Page) {
	await page.getByTestId('btnCheckOrder').click()
}

async function submitAddOrderForm(
	page: Page,
	customer: Customer,
	quantity: number,
): Promise<Order> {
	await page.getByTestId('btnPay').click()

	const response = await page.waitForResponse(
		(response) =>
			response.url() === TRANSACTIONS_ENDPOINT &&
			response.request().method() === 'POST',
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
	context: BrowserContext,
	page: Page,
	auth: Auth,
	{ customer, quantity, selectedCustomerType }: AddOrderArgs,
): Promise<Order | CustomError> {
	try {
		await setupAuth(context, page, auth)
		await navigateToVerifyCustomerPage(page, { waitUntil: 'networkidle' })

		checkCookieExpiration(page, VERIFY_CUSTOMER_URL)

		await preparingCustomer(page, customer, selectedCustomerType)
		await adjustOrderQuantity(page, quantity, customer.quota)
		await confirmOrder(page)
		const order = await submitAddOrderForm(page, customer, quantity)

		return order
	} catch (error) {
		return error as CustomError
	}
}
