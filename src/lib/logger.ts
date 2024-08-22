import chalk from 'chalk'

import { Auth, Customer, Order, Product, Profile } from './types'

export function logAuth(auth: Auth) {
	console.log(
		chalk.blue('  Access Token: ') + chalk.cyan(auth.accessToken) + '\n',
	)
}

export function logProfile(profile: Profile) {
	console.log(chalk.blue('  Profile Information:'))

	console.log(
		chalk.yellow('    - Person:') +
			'\n' +
			chalk.yellow('      - Nationality ID: ') +
			chalk.cyan(profile.person.nationalityId) +
			'\n' +
			chalk.yellow('      - Name: ') +
			chalk.cyan(profile.person.name) +
			'\n' +
			chalk.yellow('      - Email: ') +
			chalk.cyan(profile.person.email) +
			'\n' +
			chalk.yellow('      - Phone Number: ') +
			chalk.cyan(profile.person.phoneNumber) +
			'\n' +
			chalk.yellow('    - Location:') +
			'\n' +
			chalk.yellow('      - Address: ') +
			chalk.cyan(profile.location.address) +
			'\n' +
			chalk.yellow('      - Village: ') +
			chalk.cyan(profile.location.village) +
			'\n' +
			chalk.yellow('      - District: ') +
			chalk.cyan(profile.location.district) +
			'\n' +
			chalk.yellow('      - City: ') +
			chalk.cyan(profile.location.city) +
			'\n' +
			chalk.yellow('      - Province: ') +
			chalk.cyan(profile.location.province) +
			'\n' +
			chalk.yellow('      - Zip Code: ') +
			chalk.cyan(profile.location.zipCode) +
			'\n' +
			chalk.yellow('      - Coordinate: ') +
			chalk.cyan(profile.location.coordinate) +
			'\n' +
			chalk.yellow('    - Agent:') +
			'\n' +
			chalk.yellow('      - ID: ') +
			chalk.cyan(profile.agent.id) +
			'\n' +
			chalk.yellow('      - Name: ') +
			chalk.cyan(profile.agent.name) +
			'\n',
	)
}

export function logProduct(product: Product) {
	console.log(chalk.blue('  Product Information:'))

	console.log(
		chalk.yellow('    - Name: ') +
			chalk.cyan(product.name) +
			'\n' +
			chalk.yellow('    - Available Stock: ') +
			chalk.cyan(product.stock.available) +
			'\n' +
			chalk.yellow('    - Redeem Stock: ') +
			chalk.cyan(product.stock.redeem) +
			'\n',
	)
}

export function logCustomer(customer: Customer) {
	console.log(chalk.blue('  Customer Information:'))

	console.log(
		chalk.yellow('    - Personal Details:') +
			'\n' +
			chalk.yellow('      - Nationality ID: ') +
			chalk.cyan(customer.person.nationalityId) +
			'\n' +
			chalk.yellow('      - Name: ') +
			chalk.cyan(customer.person.name) +
			'\n' +
			chalk.yellow('    - Customer Types: ') +
			customer.customerTypes.map((type) => chalk.cyan(type.name)).join(' | ') +
			'\n' +
			chalk.yellow('    - Quota Remaining: ') +
			chalk.cyan(customer.quotaRemaining.thisMonth.parent) +
			'\n' +
			chalk.yellow('    - Channel Inject: ') +
			chalk.cyan(customer.channelInject) +
			'\n',
	)
}

export function logOrder(order: Order) {
	console.log(chalk.blue('  Order Information:'))

	console.log(
		chalk.yellow('    - Nationality ID: ') +
			chalk.cyan(order.nationalityId) +
			'\n' +
			chalk.yellow('    - Quantity: ') +
			chalk.cyan(order.quantity) +
			'\n',
	)
}
