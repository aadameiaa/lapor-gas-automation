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

export type Agen = {
	id: string
	name: string
}

export type Bank = {
	bankName: any
	accountName: any
	accountNumber: any
}

export type ProfileData = {
	registrationId: string
	name: string
	address: string
	city: string
	province: string
	coordinate: string
	storeName: string
	storeAddress: string
	phoneNumber: string
	tid: string
	mid: any
	spbu: string
	merchantType: string
	midMap: string
	isSubsidiProduct: boolean
	storePhoneNumber: string
	email: string
	nationalityId: string
	ditrictName: string
	villageName: string
	zipcode: string
	agen: Agen
	isActiveMyptm: boolean
	bank: Bank
	myptmActivationStatus: any
	isAvailableTransaction: boolean
}

export type ProductData = {
	registrationId: string
	storeName: string
	productId: string
	productName: string
	stockAvailable: number
	stockRedeem: number
	sold: number
	modal: number
	price: number
	productMinPrice: number
	productMaxPrice: number
	image: string
	stockDate: string
	lastStock: number
	lastStockDate: string
	lastSyncAt: string
}

export type LoginResponse = SuccessResponse<LoginData>
export type VerifyNationalityIdResponse =
	SuccessResponse<VerifyNationalityIdData>
export type ProfileResponse = SuccessResponse<ProfileData>
export type ProductsResponse = SuccessResponse<ProductData>
