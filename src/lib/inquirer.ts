import { input, password, select, Separator } from '@inquirer/prompts'
import chalk from 'chalk'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { StatusCodes } from 'http-status-codes'
import { createSpinner } from 'nanospinner'
import { Page } from 'puppeteer'

import { CustomError } from '../models/custome-error'
import { AddOrderArgs } from './args'
import { MY_PERTAMINA_DELAY } from './constants'
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
import { delay } from './utils'

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

export async function askForNationalityIdsPath(): Promise<string> {
	return await input({
		message:
			'Enter the relative file path containing customer nationality IDs (must be a .json file):',
		required: true,
		validate: (value) => {
			const relativeJsonPathRegex =
				/^(\.\/|(\.\.\/)*)([a-zA-Z0-9_\-\/]+\/?)*[a-zA-Z0-9_\-]+\.json$/

			return (
				relativeJsonPathRegex.test(value) ||
				'Please enter a valid relative file path with a .json extension (e.g., ./folder/data.json or ../data.json).'
			)
		},
	})
}

export async function askForAddOrdersArgsPath(): Promise<string> {
	return await input({
		message:
			'Enter the relative file path containing orders (must be a .json file):',
		required: true,
		validate: (value) => {
			const relativeJsonPathRegex =
				/^(\.\/|(\.\.\/)*)([a-zA-Z0-9_\-\/]+\/?)*[a-zA-Z0-9_\-]+\.json$/

			return (
				relativeJsonPathRegex.test(value) ||
				'Please enter a valid relative file path with a .json extension (e.g., ./folder/data.json or ../data.json).'
			)
		},
	})
}

async function loginTask(page: Page) {
	const phoneNumber = await askForPhoneNumber()
	const pin = await askForPin()

	const spinner = createSpinner('Processing login task').start()
	const loginData = await login(page, { phoneNumber, pin })
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

async function logoutTask(page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing logout task').start()
	const logoutData = await logout(page, auth)
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

async function getProfileTask(page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing view profile task').start()
	const profileData = await getProfile(page, auth)
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

async function getProductTask(page: Page) {
	const authFile = readFileSync('public/data/auth.json', { encoding: 'utf-8' })
	const auth = JSON.parse(authFile) as Auth
	const spinner = createSpinner('Processing check product stock task').start()
	const productData = await getProduct(page, auth)
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

async function verifyCustomersTask(page: Page) {
	const nationalityIdsPath = await askForNationalityIdsPath()
	const nationalityIdsFile = readFileSync(nationalityIdsPath, {
		encoding: 'utf-8',
	})
	const nationalityIds = JSON.parse(nationalityIdsFile) as string[]

	let customers: Customer[] = []
	for (let index = 0; index < nationalityIds.length; index++) {
		const nationalityId = nationalityIds[index]

		const authFile = readFileSync('public/data/auth.json', {
			encoding: 'utf-8',
		})
		const auth = JSON.parse(authFile) as Auth
		const spinner = createSpinner('Processing verify customer task').start()
		const customerData = await verifyCustomer(page, auth, nationalityId)
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

	return true
}

async function addOrdersTask(page: Page) {
	const addOrdersArgsPath = await askForAddOrdersArgsPath()
	const addOrdersArgsFile = readFileSync(addOrdersArgsPath, {
		encoding: 'utf-8',
	})
	const addOrdersArgs = JSON.parse(addOrdersArgsFile) as AddOrderArgs[]

	let orders: Order[] = []
	for (let index = 0; index < addOrdersArgs.length; index++) {
		const addOrderArg = addOrdersArgs[index]

		const authFile = readFileSync('public/data/auth.json', {
			encoding: 'utf-8',
		})
		const auth = JSON.parse(authFile) as Auth
		const spinner = createSpinner('Processing add order task').start()
		const orderData = await addOrder(page, auth, addOrderArg)
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
	page: Page,
	task: TaskType,
): Promise<boolean> {
	switch (task) {
		case 'LOGIN':
			return await loginTask(page)
		case 'LOGOUT':
			return await logoutTask(page)
		case 'GET_PROFILE':
			return await getProfileTask(page)
		case 'GET_PRODUCT':
			return await getProductTask(page)
		case 'VERIFY_CUSTOMERS':
			return await verifyCustomersTask(page)
		case 'ADD_ORDERS':
			return await addOrdersTask(page)
		case 'EXIT':
			return await exitTask()
		default:
			return false
	}
}
