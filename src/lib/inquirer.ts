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
} from './logger'
import {
	addOrder,
	getProduct,
	getProfile,
	login,
	logout,
	verifyCustomer,
} from './my-pertamina'
import { Auth, CustomerType, TaskType } from './types'

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
				name: 'Verify a Customer',
				value: 'VERIFY_CUSTOMER',
				description: 'Verify a specific customer by nationality ID',
			},
			{
				name: 'Create an Order',
				value: 'ADD_ORDER',
				description: 'Create a new order for a customer',
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
	})) as number
}

export async function askForCustomerType(): Promise<CustomerType> {
	return await select<CustomerType>({
		message: 'Select the customer type:',
		choices: [
			{ name: 'Rumah Tangga', value: 'Rumah Tangga' },
			{ name: 'Usaha Mikro', value: 'Usaha Mikro' },
		],
		default: 'Rumah Tangga',
	})
}

async function loginTask(page: Page) {
	const phoneNumber = await askForPhoneNumber()
	const pin = await askForPin()

	const spinner = createSpinner('Processing login task').start()
	const loginData = await login(page, { phoneNumber, pin })
	if (loginData instanceof Error) {
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
	writeFileSync('public/data/auth.json', JSON.stringify(loginData), {
		encoding: 'utf-8',
	})

	return true
}

async function logoutTask(page: Page) {
	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	)

	const spinner = createSpinner('Processing logout task').start()
	const logoutData = await logout(page, auth)
	if (logoutData instanceof Error) {
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
	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing view profile task').start()
	const profileData = await getProfile(page, auth)
	if (profileData instanceof Error) {
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
	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing check product stock task').start()
	const productData = await getProduct(page, auth)
	if (productData instanceof Error) {
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

async function verifyCustomerTask(page: Page) {
	const nationalityId = await askForNationalityId()

	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing verify customer task').start()
	const customerData = await verifyCustomer(page, auth, nationalityId)
	if (customerData instanceof Error) {
		spinner.error({
			text: chalk.red.bold(customerData.message + '\n'),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 Verify customer Successful! 🎉\n'),
	})

	logCustomer(customerData)

	return true
}

async function addOrderTask(page: Page) {
	const nationalityId = await askForNationalityId()
	const quantity = await askForOrderQuantity()
	const selectedCustomerType = await askForCustomerType()

	const auth = JSON.parse(
		readFileSync('public/data/auth.json', { encoding: 'utf-8' }),
	) as Auth
	const spinner = createSpinner('Processing add order task').start()
	const orderData = await addOrder(page, auth, {
		nationalityId,
		selectedCustomerType,
		quantity,
	})
	if (orderData instanceof Error) {
		spinner.error({
			text: chalk.red.bold(orderData.message + '\n'),
		})

		return true
	}

	spinner.success({
		text: chalk.green.bold('🎉 Add order Successful! 🎉\n'),
	})

	logOrder(orderData)

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
		case 'VERIFY_CUSTOMER':
			return await verifyCustomerTask(page)
		case 'ADD_ORDER':
			return await addOrderTask(page)
		case 'EXIT':
			return await exitTask()
		default:
			return false
	}
}
