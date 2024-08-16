import { Cookie } from 'puppeteer'

import {
	LoginData,
	LoginResponse,
	ProductsResponse,
	ProfileResponse,
	VerifyNationalityIdResponse,
} from '@/lib/responses'
import { Auth, Customer, Person, Product, Profile } from '@/lib/types'

export function authDTO({ data }: LoginResponse, cookies: Cookie[]): Auth {
	return {
		cookies,
		accessToken: data.accessToken,
		settings: {
			isLogin: data.isLogin,
			merchantType: data.myptmMerchantType,
			isDefaultPin: data.isDefaultPin,
			isNewUser: data.isNewUserMyptm,
			isSubsidyProduct: data.isSubsidiProduct,
		},
	}
}

export function revertAuthDTO(auth: Auth): LoginData {
	return {
		accessToken: auth.accessToken,
		isLogin: auth.settings.isLogin,
		myptmMerchantType: auth.settings.merchantType,
		isDefaultPin: auth.settings.isDefaultPin,
		isNewUserMyptm: auth.settings.isNewUser,
		isSubsidiProduct: auth.settings.isSubsidyProduct,
	}
}

export function customerDTO(
	{ data }: VerifyNationalityIdResponse,
	nationalityId: Person['nationalityId'],
): Customer {
	return {
		person: {
			nationalityId,
			familyId: data.familyId,
			name: data.name,
			email: data.email,
			phoneNumber: data.phoneNumber,
		},
		quotaRemaining: {
			thisMonth: data.quotaRemaining,
			lastMonth: data.quotaRemainingLastMonth,
		},
		customerTypes: data.customerTypes,
		channelInject: data.channelInject,
		flags: {
			isAgreedTermsConditions: data.isAgreedTermsConditions,
			isCompleted: data.isCompleted,
			isSubsidy: data.isSubsidi,
		},
	}
}

export function profileDTO({ data }: ProfileResponse): Profile {
	return {
		person: {
			nationalityId: data.nationalityId,
			name: data.name,
			email: data.email,
			phoneNumber: data.phoneNumber,
		},
		location: {
			address: data.address,
			village: data.villageName,
			district: data.ditrictName,
			city: data.city,
			province: data.province,
			zipCode: data.zipcode,
			coordinate: data.coordinate,
		},
		store: {
			registrationId: data.registrationId,
			name: data.storeName,
			phoneNumber: data.phoneNumber,
			address: data.storeAddress,
		},
		tid: data.tid,
		mid: data.mid,
		spbu: data.spbu,
		merchantType: data.merchantType,
		midMap: data.mid,
		agent: data.agen,
		bank: data.bank,
		activationStatus: data.myptmActivationStatus,
		flags: {
			isSubsidyProduct: data.isSubsidiProduct,
			isActive: data.isActiveMyptm,
			isAvailableTransaction: data.isAvailableTransaction,
		},
	}
}

export function productDTO({ data }: ProductsResponse): Product {
	return {
		id: data.productId,
		name: data.productName,
		image: data.image,
		minPrice: data.productMinPrice,
		maxPrice: data.productMaxPrice,
		store: {
			registrationId: data.registrationId,
			name: data.storeName,
			sold: data.sold,
			modal: data.modal,
			price: data.price,
		},
		stock: {
			available: data.stockAvailable,
			redeem: data.stockRedeem,
			date: data.stockDate,
			last: data.lastStock,
			lastDate: data.lastStockDate,
			lastSyncAt: data.lastSyncAt,
		},
	}
}
