import { input, password } from '@inquirer/prompts'
import chalk from 'chalk'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { StatusCodes } from 'http-status-codes'
import { createSpinner } from 'nanospinner'

import { BrowserContext, Page } from 'playwright'
import { CustomError } from '../models/custom-error'
import { AddOrderArgs } from './args'
import { CUSTOMER_TYPES, MY_PERTAMINA_DELAY } from './constants'
import {
	logAuth,
	logCustomer,
	logOrder,
	logProduct,
	logProfile,
} from './logger'
import {
	addOrder,
	getProduct,
	getProfile,
	login,
	logout,
	verifyCustomer,
} from './my-pertamina'
import { Auth, Customer, Order } from './types'
import { delay } from './utils'

export async function askForPhoneNumber(): Promise<string> {
	return await input({
		message: 'Enter your phone number:',
		required: true,
		validate: (value) => {
			const phoneNumberRegex = /^\d{10,13}$/

			return (
				phoneNumberRegex.test(value) ||
				'Please enter your phone number without country code prefixes such as +62 and be between 10 and 13 digits long.'
			)
		},
	})
}

export async function askForPin(): Promise<string> {
	return await password({
		message: 'Enter your PIN:',
		mask: true,
		validate: (value) => {
			const pinRegex = /^\d{6}$/

			return (
				pinRegex.test(value) || 'Please enter your PIN as a 6-digit number.'
			)
		},
	})
}

export async function performLogin(context: BrowserContext, page: Page) {
	const phoneNumber = await askForPhoneNumber()
	const pin = await askForPin()

	const spinner = createSpinner('Processing login task').start()
	const loginData = await login(context, page, { phoneNumber, pin })
	if (loginData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(loginData.message + '\n'),
		})

		return
	}

	spinner.success({
		text: chalk.green.bold('🎉 Login Successful! 🎉\n'),
	})

	logAuth(loginData)
	mkdirSync('public/data', { recursive: true })
	writeFileSync('public/data/auth.json', JSON.stringify(loginData, null, 2), {
		encoding: 'utf-8',
	})
}

export async function performLogout(context: BrowserContext, page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing logout task').start()
	const logoutData = await logout(context, page, auth)
	if (logoutData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(logoutData.message + '\n'),
		})

		return
	}

	unlinkSync('public/data/auth.json')

	spinner.success({
		text: chalk.green.bold('You have been logged out successfully. 👋'),
	})
	console.log(
		chalk.blue(
			'  Your session has ended. Please log in again when you need to use the system.',
		),
	)
	console.log(chalk.cyan('  Take care and see you next time! ✨\n'))
}

export async function performGetProfile(context: BrowserContext, page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing view profile task').start()
	const profileData = await getProfile(context, page, auth)
	if (profileData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(profileData.message + '\n'),
		})

		return
	}

	spinner.success({
		text: chalk.green.bold('🎉 View profile Successful! 🎉\n'),
	})

	logProfile(profileData)
}

export async function performGetStock(context: BrowserContext, page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing check product stock task').start()
	const productData = await getProduct(context, page, auth)
	if (productData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(productData.message + '\n'),
		})

		return
	}

	spinner.success({
		text: chalk.green.bold('🎉 View profile Successful! 🎉\n'),
	})

	logProduct(productData)
}

function isValidNationalityIds(data: any): data is string[] {
	if (!Array.isArray(data)) {
		throw false
	}

	return data.every((item) => typeof item === 'string')
}

export async function performVerifyCustomers(
	context: BrowserContext,
	page: Page,
	filePath: string,
) {
	const nationalityIdsFile = readFileSync(filePath, {
		encoding: 'utf-8',
	})
	const nationalityIds = JSON.parse(nationalityIdsFile)

	if (!isValidNationalityIds(nationalityIds)) {
		console.log(
			chalk.red.bold(
				'  Invalid data: Expected an array of strings representing nationality IDs.' +
					'\n',
			),
		)

		return
	}

	let customers: Customer[] = []
	for (let index = 0; index < nationalityIds.length; index++) {
		const nationalityId = nationalityIds[index]

		const authFile = readFileSync('public/data/auth.json', {
			encoding: 'utf-8',
		})
		const auth = JSON.parse(authFile) as Auth
		const spinner = createSpinner('Processing verify customer task').start()
		const customerData = await verifyCustomer(
			context,
			page,
			auth,
			nationalityId,
		)
		if (customerData instanceof CustomError) {
			spinner.error({
				text: chalk.red.bold(customerData.message + '\n'),
			})

			if (customerData.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
				index--

				await delay(MY_PERTAMINA_DELAY)
			}

			continue
		}

		spinner.success({
			text: chalk.green.bold('🎉 Verify customer Successful! 🎉\n'),
		})

		logCustomer(customerData)

		customers = [...customers, customerData]
	}

	writeFileSync(
		'public/data/customers.json',
		JSON.stringify(customers, null, 2),
		{
			encoding: 'utf-8',
		},
	)
}

function isValidOrderArgs(data: any): data is AddOrderArgs[] {
	if (!Array.isArray(data)) {
		return false
	}

	return data.every((item) => {
		if (typeof item !== 'object' && item === null) {
			return false
		}

		const { customer, quantity, selectedCustomerType } = item

		return (
			typeof customer === 'object' &&
			customer !== null &&
			typeof customer.nationalityId === 'string' &&
			typeof customer.name === 'string' &&
			typeof customer.quota === 'number' &&
			Array.isArray(customer.types) &&
			customer.types.every((type: any) => CUSTOMER_TYPES.includes(type)) &&
			typeof quantity === 'number' &&
			quantity > 0 &&
			(!selectedCustomerType || CUSTOMER_TYPES.includes(selectedCustomerType))
		)
	})
}

export async function performAddOrders(
	context: BrowserContext,
	page: Page,
	filePath: string,
) {
	const addOrdersArgsFile = readFileSync(filePath, {
		encoding: 'utf-8',
	})
	const addOrdersArgs = JSON.parse(addOrdersArgsFile)

	if (!isValidOrderArgs(addOrdersArgs)) {
		console.log(
			chalk.red.bold(
				'  Invalid data: Each order argument must have the following structure:\n' +
					'  { customer: { nationalityId: string, name: string, quota: number, types: ("Rumah Tangga" | "Usaha Mikro" | "Pengecer")[] }, quantity: positive number, selectedCustomerType?: "Rumah Tangga" | "Usaha Mikro" | "Pengecer" }',
			),
		)

		return
	}

	let orders: Order[] = []
	for (let index = 0; index < addOrdersArgs.length; index++) {
		const addOrderArg = addOrdersArgs[index]

		const authFile = readFileSync('public/data/auth.json', {
			encoding: 'utf-8',
		})
		const auth = JSON.parse(authFile) as Auth
		const spinner = createSpinner('Processing add order task').start()
		const orderData = await addOrder(context, page, auth, addOrderArg)
		if (orderData instanceof CustomError) {
			spinner.error({
				text: chalk.red.bold(orderData.message + '\n'),
			})

			if (orderData.statusCode === StatusCodes.TOO_MANY_REQUESTS) {
				index--

				await delay(MY_PERTAMINA_DELAY)
			}

			continue
		}

		spinner.success({
			text: chalk.green.bold('🎉 Add order Successful! 🎉\n'),
		})

		logOrder(orderData)

		orders = [...orders, orderData]
	}

	writeFileSync('public/data/orders.json', JSON.stringify(orders, null, 2), {
		encoding: 'utf-8',
	})
}
