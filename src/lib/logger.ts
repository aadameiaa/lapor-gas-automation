import chalk from 'chalk'

import { Auth, Customer, Order, Product, Profile } from './types'

export function logAuth(auth: Auth) {
	console.log(
		chalk.blue('  Access Token: ') + chalk.cyan(auth.accessToken) + '\n',
	)
}

export function logProfile({ person, location, agent }: Profile) {
	console.log(chalk.blue('  Profile Information:'))

	console.log(
		chalk.yellow('    - Person:') +
			'\n' +
			chalk.yellow('      - Nationality ID: ') +
			chalk.cyan(person.nationalityId) +
			'\n' +
			chalk.yellow('      - Name: ') +
			chalk.cyan(person.name) +
			'\n' +
			chalk.yellow('      - Email: ') +
			chalk.cyan(person.email) +
			'\n' +
			chalk.yellow('      - Phone Number: ') +
			chalk.cyan(person.phoneNumber) +
			'\n' +
			chalk.yellow('    - Location:') +
			'\n' +
			chalk.yellow('      - Address: ') +
			chalk.cyan(location.address) +
			'\n' +
			chalk.yellow('      - Village: ') +
			chalk.cyan(location.village) +
			'\n' +
			chalk.yellow('      - District: ') +
			chalk.cyan(location.district) +
			'\n' +
			chalk.yellow('      - City: ') +
			chalk.cyan(location.city) +
			'\n' +
			chalk.yellow('      - Province: ') +
			chalk.cyan(location.province) +
			'\n' +
			chalk.yellow('      - Zip Code: ') +
			chalk.cyan(location.zipCode) +
			'\n' +
			chalk.yellow('      - Coordinate: ') +
			chalk.cyan(location.coordinate) +
			'\n' +
			chalk.yellow('    - Agent:') +
			'\n' +
			chalk.yellow('      - ID: ') +
			chalk.cyan(agent.id) +
			'\n' +
			chalk.yellow('      - Name: ') +
			chalk.cyan(agent.name) +
			'\n',
	)
}

export function logProduct({ id, name, stock }: Product) {
	console.log(chalk.blue('  Product Information:'))

	console.log(
		chalk.yellow('    - ID: ') +
			chalk.cyan(id) +
			'\n' +
			chalk.yellow('    - Name: ') +
			chalk.cyan(name) +
			'\n' +
			chalk.yellow('    - Available Stock: ') +
			chalk.cyan(stock.available) +
			'\n' +
			chalk.yellow('    - Redeem Stock: ') +
			chalk.cyan(stock.redeem) +
			'\n',
	)
}

export function logCustomer({ nationalityId, name, types, quota }: Customer) {
	console.log(chalk.blue('  Customer Information:'))

	console.log(
		chalk.yellow('    - Personal Details:') +
			'\n' +
			chalk.yellow('      - Nationality ID: ') +
			chalk.cyan(nationalityId) +
			'\n' +
			chalk.yellow('      - Name: ') +
			chalk.cyan(name) +
			'\n' +
			chalk.yellow('    - Customer Types: ') +
			types.map((type) => chalk.cyan(type)).join(' | ') +
			'\n' +
			chalk.yellow('    - Quota Remaining: ') +
			chalk.cyan(quota) +
			'\n',
	)
}

export function logOrder({ id, customer, product }: Order) {
	console.log(chalk.blue('  Order Information:'))

	console.log(
		chalk.yellow('    - Order ID: ') +
			chalk.cyan(id) +
			'\n' +
			chalk.yellow('    - Customer:') +
			'\n' +
			chalk.yellow('      - Nationality ID: ') +
			chalk.cyan(customer.nationalityId) +
			'\n' +
			chalk.yellow('      - Name: ') +
			chalk.cyan(customer.name) +
			'\n' +
			chalk.yellow('      - Quota: ') +
			chalk.cyan(customer.quota) +
			'\n' +
			chalk.yellow('    - Product:') +
			'\n' +
			chalk.yellow('      - Product ID: ') +
			chalk.cyan(product.id) +
			'\n' +
			chalk.yellow('      - Quantity: ') +
			chalk.cyan(product.quantity) +
			'\n',
	)
}
