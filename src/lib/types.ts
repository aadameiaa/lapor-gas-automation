import { Cookie } from 'puppeteer'

import { CUSTOMER_TYPES, TASK_TYPES } from './constants'

export type TaskType = (typeof TASK_TYPES)[number]
export type CustomerType = (typeof CUSTOMER_TYPES)[number]

type AuthSettings = {
	isLogin: boolean
	merchantType: string
	isDefaultPin: boolean
	isNewUser: boolean
	isSubsidyProduct: boolean
}

export type Auth = {
	cookies: Cookie[]
	accessToken: string
	settings: AuthSettings
}

export type Customer = {
	nationalityId: string
	name: string
	quota: number
	types: CustomerType[]
}

type Person = {
	nationalityId: string
	name: string
	email: string
	phoneNumber: string
}

type Location = {
	address: string
	village: string
	district: string
	city: string
	province: string
	zipCode: string
	coordinate: string
}

type Agent = {
	id: string
	name: string
}

export type Profile = {
	person: Person
	location: Location
	agent: Agent
}

type Stock = {
	available: number
	redeem: number
}

export type Product = {
	id: string
	name: string
	stock: Stock
}

export type Order = {
	id: string
	customer: {
		nationalityId: string
		name: string
		quota: number
	}
	product: {
		id: string
		name: string
		quantity: number
	}
}
