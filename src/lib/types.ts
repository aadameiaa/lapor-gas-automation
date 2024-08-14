import { Cookie } from 'puppeteer'

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

type Person = {
	nationalityId: string
	familyId: string
	name: string
	email: string
	phoneNumber: string
}

type QuotaRemaining = {
	type: number
	parent: number
	retailer: number
}

type QuotaRemainingLastMonth = {
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
	person: Person
	quotaRemaining: QuotaRemaining
	quotaRemainingLastMonth: QuotaRemainingLastMonth
	customerTypes: CustomerType[]
	channelInject: string
	flags: Flags
}
