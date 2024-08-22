import { CustomerType } from './types'

export type LoginArgs = {
	phoneNumber: string
	pin: string
}

export type AddOrderArgs = {
	nationalityId: string
	selectedCustomerType: CustomerType
	quantity: number
}
