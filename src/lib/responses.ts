type SuccessResponse<T> = {
	success: boolean
	data: T
	message: string
	code: number
}

export type LoginData = {
	accessToken: string
	isLogin: boolean
	myptmMerchantType: string
	isDefaultPin: boolean
	isNewUserMyptm: boolean
	isSubsidiProduct: boolean
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

export type VerifyNationalityIdData = {
	nationalityId: string
	familyId: string
	name: string
	email: string
	phoneNumber: string
	quotaRemaining: QuotaRemaining
	quotaRemainingLastMonth: QuotaRemainingLastMonth
	customerTypes: CustomerType[]
	channelInject: string
	isAgreedTermsConditions: boolean
	isCompleted: boolean
	isSubsidi: boolean
}

export type LoginResponse = SuccessResponse<LoginData>
export type VerifyNationalityIdResponse =
	SuccessResponse<VerifyNationalityIdData>
