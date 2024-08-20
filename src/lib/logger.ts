import chalk from 'chalk'

import { Auth } from '@/lib/types'

export function logAuth(auth: Auth) {
	console.log(chalk.blue('Access Token: ') + chalk.cyan(auth.accessToken))

	console.log(
		chalk.blue('Settings:') +
			'\n' +
			chalk.yellow('  - isLogin: ') +
			chalk.green(auth.settings.isLogin) +
			'\n' +
			chalk.yellow('  - Merchant Type: ') +
			chalk.magenta(auth.settings.merchantType) +
			'\n' +
			chalk.yellow('  - isDefaultPin: ') +
			chalk.green(auth.settings.isDefaultPin) +
			'\n' +
			chalk.yellow('  - isNewUser: ') +
			chalk.green(auth.settings.isNewUser) +
			'\n' +
			chalk.yellow('  - isSubsidyProduct: ') +
			chalk.green(auth.settings.isSubsidyProduct) +
			'\n',
	)
}
