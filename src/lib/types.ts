import { Cookie } from 'puppeteer'

export type AccessToken = string

export type AuthSettings = {
	isLogin: boolean
	merchantType: string
	isDefaultPin: boolean
	isNewUser: boolean
	isSubsidyProduct: boolean
}

export type Auth = {
	cookies: Cookie[]
	accessToken: AccessToken
	settings: AuthSettings
}

export type SuccessResponse<T> = {
	success: boolean
	data: T
	message: string
	code: number
}

export type ErrorResponse = {
	code: number
	message: string
}

export type LoginData = {
	accessToken: string
	isLogin: boolean
	myptmMerchantType: string
	isDefaultPin: boolean
	isNewUserMyptm: boolean
	isSubsidiProduct: boolean
}

export type LoginResponse = SuccessResponse<LoginData>
