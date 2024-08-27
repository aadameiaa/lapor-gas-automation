#!/usr/bin/env node

import chalk from 'chalk'

import { askForTask, processTask } from './lib/inquirer'
import { initializeBrowser } from './lib/playwright'

const main = async () => {
	console.log(chalk.green.bold('Welcome to LPG Gas Automation CLI! 🚀'))
	console.log(
		chalk.blue(
			'Your one-stop solution for managing 3 kg LPG gas distribution efficiently.',
		),
	)
	console.log(chalk.cyan('Please select an option below to get started:\n'))

	const { browser, context, page } = await initializeBrowser()

	let isRunning = true
	while (isRunning) {
		const task = await askForTask()
		isRunning = await processTask(context, page, task)
	}

	await context.close()
	await browser.close()
}

main()
