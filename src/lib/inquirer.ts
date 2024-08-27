import { input, password, search, select, Separator } from '@inquirer/prompts'
import chalk from 'chalk'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { StatusCodes } from 'http-status-codes'
import { createSpinner } from 'nanospinner'

import path from 'path'
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
import { Auth, Customer, Order, TaskType } from './types'
import { delay, getFiles, randomIntFromInterval } from './utils'

export async function askForTask(): Promise<TaskType> {
	return await select<TaskType>({
		message: 'What task would you like to perform?',
		choices: [
			{
				name: 'Login',
				value: 'LOGIN',
				description: 'Log into the system',
			},
			{
				name: 'Logout',
				value: 'LOGOUT',
				description: 'Log out of the system',
			},
			{
				name: 'View Profile',
				value: 'GET_PROFILE',
				description: 'View the profile of the logged-in user',
			},
			{
				name: 'Check Product Stock',
				value: 'GET_PRODUCT',
				description: 'View the current stock of available products',
			},
			{
				name: 'Verify Customers',
				value: 'VERIFY_CUSTOMERS',
				description: 'Verify multiple customers by nationality IDs',
			},
			{
				name: 'Create Orders',
				value: 'ADD_ORDERS',
				description: 'Create new orders for multiple customers',
			},
			{
				name: 'Exit',
				value: 'EXIT',
				description: 'Stop the program',
			},
			new Separator(),
		],
	})
}

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

export async function askForFilePath(message: string): Promise<string> {
	return await search({
		message,
		source: async (input) => {
			if (!input) return []

			const files = getFiles('./public')

			return files
				.filter((file) => path.extname(file) === '.json')
				.filter((file) => file.includes(input))
				.map((file) => ({
					name: file,
					value: file,
				}))
		},
	})
}

async function loginTask(context: BrowserContext, page: Page) {
	const phoneNumber = await askForPhoneNumber()
	const pin = await askForPin()

	const spinner = createSpinner('Processing login task').start()
	const loginData = await login(context, page, { phoneNumber, pin })
	if (loginData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(loginData.message + '\n'),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 Login Successful! 🎉\n'),
	})

	logAuth(loginData)
	mkdirSync('public/data', { recursive: true })
	writeFileSync('public/data/auth.json', JSON.stringify(loginData, null, 2), {
		encoding: 'utf-8',
	})

	return true
}

async function logoutTask(context: BrowserContext, page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing logout task').start()
	const logoutData = await logout(context, page, auth)
	if (logoutData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(logoutData.message + '\n'),
		})

		return true
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

	return true
}

async function getProfileTask(context: BrowserContext, page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing view profile task').start()
	const profileData = await getProfile(context, page, auth)
	if (profileData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(profileData.message + '\n'),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 View profile Successful! 🎉\n'),
	})

	logProfile(profileData)

	return true
}

async function getProductTask(context: BrowserContext, page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing check product stock task').start()
	const productData = await getProduct(context, page, auth)
	if (productData instanceof CustomError) {
		spinner.error({
			text: chalk.red.bold(productData.message + '\n'),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 View profile Successful! 🎉\n'),
	})

	logProduct(productData)

	return true
}

function isValidNationalityIds(data: any): data is string[] {
	if (!Array.isArray(data)) {
		throw false
	}

	return data.every((item) => typeof item === 'string')
}

async function verifyCustomersTask(context: BrowserContext, page: Page) {
	const nationalityIdsPath = await askForFilePath(
		'Please choose a file that contains the customer nationality IDs data',
	)
	const nationalityIdsFile = readFileSync(nationalityIdsPath, {
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

		return true
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

	const orders: AddOrderArgs[] = customers
		.filter((customer) => customer.quota > 3)
		.map((customer) => ({
			customer,
			quantity: randomIntFromInterval(1, customer.quota > 7 ? 7 : 3),
			selectedCustomerType: customer.types[0],
		}))

	writeFileSync('public/data/orders.json', JSON.stringify(orders, null, 2), {
		encoding: 'utf-8',
	})

	return true
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

async function addOrdersTask(context: BrowserContext, page: Page) {
	const addOrdersArgsPath = await askForFilePath(
		'Please choose a file that contains the orders data',
	)
	const addOrdersArgsFile = readFileSync(addOrdersArgsPath, {
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

		return true
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

	return true
}

async function exitTask() {
	console.log(
		chalk.green.bold('  Thank you for using LPG Gas Automation CLI! 🙏'),
	)
	console.log(chalk.blue('  We hope to see you again. Have a great day! 🌟'))
	console.log(chalk.cyan('  Goodbye! 👋\n'))

	return false
}

export async function processTask(
	context: BrowserContext,
	page: Page,
	task: TaskType,
): Promise<boolean> {
	switch (task) {
		case 'LOGIN':
			return await loginTask(context, page)
		case 'LOGOUT':
			return await logoutTask(context, page)
		case 'GET_PROFILE':
			return await getProfileTask(context, page)
		case 'GET_PRODUCT':
			return await getProductTask(context, page)
		case 'VERIFY_CUSTOMERS':
			return await verifyCustomersTask(context, page)
		case 'ADD_ORDERS':
			return await addOrdersTask(context, page)
		case 'EXIT':
			return await exitTask()
		default:
			return false
	}
}
