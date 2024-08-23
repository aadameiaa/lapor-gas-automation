import { Customer, CustomerType } from './types'

export type LoginArgs = {
	phoneNumber: string
	pin: string
}

export type AddOrderArgs = {
	customer: Customer
	quantity: number
	selectedCustomerType?: CustomerType
}
