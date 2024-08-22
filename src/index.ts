#!/usr/bin/env node

import chalk from 'chalk'

import { askForTask, processTask } from './lib/inquirer'
import { createBrowser, setupPage } from './lib/puppeteer'

const main = async () => {
	const browser = await createBrowser()
	const page = await setupPage(browser)

	console.log(chalk.green.bold('Welcome to LPG Gas Automation CLI! 🚀'))
	console.log(
		chalk.blue(
			'Your one-stop solution for managing 3 kg LPG gas distribution efficiently.',
		),
	)
	console.log(chalk.cyan('Please select an option below to get started:\n'))

	let isRunning = true
	while (isRunning) {
		const task = await askForTask()
		isRunning = await processTask(page, task)
	}

	await browser.close()
}

main()
