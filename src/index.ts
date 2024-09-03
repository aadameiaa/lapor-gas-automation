#!/usr/bin/env node

import { Command } from 'commander'

import {
	performAddOrders,
	performGetProfile,
	performGetStock,
	performLogin,
	performLogout,
	performVerifyCustomers,
} from './lib/inquirer'
import { initializeBrowser } from './lib/playwright'

const main = async () => {
	const { browser, context, page } = await initializeBrowser()

	const program = new Command()

	program
		.name('lapor-gas-automation')
		.description(
			'A command-line tool to automate the reporting and management of 3 kg LPG gas transactions, including customer verification and stock checks.',
		)
		.version('1.2.1')

	program
		.command('login')
		.description('Log into the system')
		.action(async () => await performLogin(context, page))

	program
		.command('logout')
		.description('Log out of the system')
		.action(async () => await performLogout(context, page))

	program
		.command('profile')
		.description('View the profile of the logged-in user')
		.action(async () => await performGetProfile(context, page))

	program
		.command('stock')
		.description('View the current stock of available products')
		.action(async () => await performGetStock(context, page))

	program
		.command('verify-customers')
		.description('Verify multiple customers by nationality IDs')
		.argument(
			'<string>',
			'path to the file that contains an array of nationality IDs',
		)
		.action(
			async (filePath) => await performVerifyCustomers(context, page, filePath),
		)

	program
		.command('create-orders')
		.description('Create new orders for multiple customers')
		.argument('<string>', 'path to the file that contains an array of orders')
		.action(async (filePath) => await performAddOrders(context, page, filePath))

	await program.parseAsync(process.argv)

	await context.close()
	await browser.close()
}

main()
