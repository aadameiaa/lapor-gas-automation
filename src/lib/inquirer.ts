import { input, number, password, select, Separator } from '@inquirer/prompts'
import chalk from 'chalk'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { createSpinner } from 'nanospinner'
import { Page } from 'puppeteer'

import {
	logAuth,
	logCustomer,
	logOrder,
	logProduct,
	logProfile,
} from '@/lib/logger'
import {
	addOrder,
	getProduct,
	getProfile,
	login,
	logout,
	verifyCustomer,
} from '@/lib/my-pertamina'
import { Auth, TaskType } from '@/lib/types'

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
				value: 'VIEW_PROFILE',
				description: 'View the profile of the logged-in user',
			},
			{
				name: 'Check Product Stock',
				value: 'CHECK_PRODUCT_STOCK',
				description: 'View the current stock of available products',
			},
			{
				name: 'Verify a Customer',
				value: 'VERIFY_CUSTOMER',
				description: 'Verify a specific customer by nationality ID',
			},
			{
				name: 'Verify Multiple Customers',
				value: 'VERIFY_CUSTOMERS',
				description: 'Verify a list of customers by nationality IDs',
			},
			{
				name: 'Create an Order',
				value: 'CREATE_ORDER',
				description: 'Create a new order for a customer',
			},
			{
				name: 'Create Multiple Orders',
				value: 'CREATE_ORDERS',
				description: 'Create multiple orders for different customers',
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

export async function askForNationalityId(): Promise<string> {
	return await input({
		message: 'Enter customer nationality ID:',
		required: true,
		validate: (value) => {
			const nationalityIdRegex = /^\d{16}$/

			return (
				nationalityIdRegex.test(value) ||
				'Please enter customer nationality ID as a 16-digit number.'
			)
		},
	})
}

export async function askForOrderQuantity(): Promise<number> {
	return (await number({
		message: 'Enter order quantity for LPG 3 kg:',
		required: true,
		default: 1,
		min: 1,
		max: 20,
		// validate: (value) => {
		// 	return (
		// 		(value && value >= 1) || 'The order quantity must be greater than one.'
		// 	)
		// },
	})) as number
}

async function processLoginTask(page: Page) {
	const phoneNumber = await askForPhoneNumber()
	const pin = await askForPin()

	const spinner = createSpinner('Processing login task').start()
	const data = await login(page, phoneNumber, pin)
	if (typeof data === 'number') {
		spinner.error({
			text: chalk.red.bold(`Login failed with status code: ${data}\n`),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 Login Successful! 🎉\n'),
	})

	logAuth(data)
	mkdirSync('public/data', { recursive: true })
	writeFileSync('public/data/auth.json', JSON.stringify(data), {
		encoding: 'utf-8',
	})

	return true
}

async function processLogoutTask(page: Page) {
	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	)

	const spinner = createSpinner('Processing logout task').start()
	const data = await logout(page, auth)

	if (typeof data === 'number') {
		spinner.error({
			text: chalk.red.bold(`Logout failed with status code: ${data}\n`),
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

async function processViewProfileTask(page: Page) {
	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing view profile task').start()
	const data = await getProfile(page, auth)

	if (typeof data === 'number') {
		spinner.error({ text: `View profile failed with status code: ${data}` })

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 View profile Successful! 🎉\n'),
	})

	logProfile(data)

	return true
}

async function processCheckProductStock(page: Page) {
	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing check product stock task').start()
	const data = await getProduct(page, auth)

	if (typeof data === 'number') {
		spinner.error({
			text: chalk.red.bold(
				`Check product stock failed with status code: ${data}\n`,
			),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 View profile Successful! 🎉\n'),
	})

	logProduct(data)

	return true
}

async function processVerifyCustomerTask(page: Page) {
	const nationalityId = await askForNationalityId()

	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing verify customer task').start()
	const data = await verifyCustomer(page, auth, nationalityId)

	if (typeof data === 'number') {
		spinner.error({
			text: chalk.red.bold(
				`Verify customer failed with status code: ${data}\n`,
			),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 Verify customer Successful! 🎉\n'),
	})

	logCustomer(data)

	return true
}

async function processAddOrderTask(page: Page) {
	const nationalityId = await askForNationalityId()
	const quantity = await askForOrderQuantity()

	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing add order task').start()
	const data = await addOrder(page, auth, { nationalityId, quantity })

	if (typeof data === 'number') {
		spinner.error({
			text: chalk.red.bold(`Add order failed with status code: ${data}\n`),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 Add order Successful! 🎉\n'),
	})

	logOrder(data)

	return true
}

async function processExitTask() {
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
			return await processLoginTask(page)
		case 'LOGOUT':
			return await processLogoutTask(page)
		case 'VIEW_PROFILE':
			return await processViewProfileTask(page)
		case 'CHECK_PRODUCT_STOCK':
			return await processCheckProductStock(page)
		case 'VERIFY_CUSTOMER':
			return await processVerifyCustomerTask(page)
		case 'VERIFY_CUSTOMERS':
			return true
		case 'CREATE_ORDER':
			return await processAddOrderTask(page)
		case 'CREATE_ORDERS':
			return true
		case 'EXIT':
			return await processExitTask()
		default:
			return false
	}
}
