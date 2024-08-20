import { input, password, select, Separator } from '@inquirer/prompts'
import chalk from 'chalk'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import { createSpinner } from 'nanospinner'
import { Page } from 'puppeteer'

import { logAuth } from '@/lib/logger'
import { login, logout } from '@/lib/my-pertamina'
import { TaskType } from '@/lib/types'

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
				name: 'Verify a Single Customer',
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
			'Your session has ended. Please log in again when you need to use the system.',
		),
	)
	console.log(chalk.cyan('Take care and see you next time! ✨\n'))

	return true
}

async function processExitTask() {
	console.log(
		chalk.green.bold('Thank you for using LPG Gas Automation CLI! 🙏'),
	)
	console.log(chalk.blue('We hope to see you again. Have a great day! 🌟'))
	console.log(chalk.cyan('Goodbye! 👋\n'))

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
		case 'EXIT':
			return await processExitTask()
		default:
			return false
	}
}
