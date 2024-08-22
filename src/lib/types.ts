import { Cookie } from 'puppeteer'

import { TASK_TYPES } from './constants'

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

export type Person = {
	nationalityId: string
	name: string
	email: string
	phoneNumber: string
}

type CustomerPerson = Person & {
	familyId: string
}

type QuotaRemaining = {
	type: number
	parent: number
	retailer: number
}

type Merchant = {
	name: string
	mid: string
	address: string
}

type CustomerType = {
	name: string
	sourceTypeId: number
	status: number
	verifications: any[]
	merchant: Merchant
}

type Flags = {
	isAgreedTermsConditions: boolean
	isCompleted: boolean
	isSubsidy: boolean
}

export type Customer = {
	person: CustomerPerson
	quotaRemaining: {
		thisMonth: QuotaRemaining
		lastMonth: QuotaRemaining
	}
	customerTypes: CustomerType[]
	channelInject: string
	flags: Flags
}

export type Order = {
	nationalityId: Person['nationalityId']
	quantity: number
}

type Agent = {
	id: string
	name: string
}

type Bank = {
	bankName: any
	accountName: any
	accountNumber: any
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

type ProfileFlags = {
	isSubsidyProduct: boolean
	isActive: boolean
	isAvailableTransaction: boolean
}

type ProfileStore = {
	registrationId: string
	name: string
	phoneNumber: string
	address: string
}

export type Profile = {
	person: Person
	location: Location
	store: ProfileStore
	tid: string
	mid: any
	spbu: string
	merchantType: string
	midMap: string
	agent: Agent
	bank: Bank
	activationStatus: any
	flags: ProfileFlags
}

type ProductStore = {
	registrationId: string
	name: string
	sold: number
	modal: number
	price: number
}

type Stock = {
	available: number
	redeem: number
	date: string
	last: number
	lastDate: string
	lastSyncAt: string
}

export type Product = {
	id: string
	name: string
	image: string
	minPrice: number
	maxPrice: number
	store: ProductStore
	stock: Stock
}

export type TaskType = (typeof TASK_TYPES)[number]
