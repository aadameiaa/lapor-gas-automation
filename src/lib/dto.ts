import { Cookie } from 'playwright'

import { PRODUCT_ID, PRODUCT_NAME } from './constants'
import {
	LoginData,
	LoginResponse,
	ProductsResponse,
	ProfileResponse,
	TransactionResponse,
	VerifyNationalityIdResponse,
} from './responses'
import { Auth, Customer, CustomerType, Order, Product, Profile } from './types'

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
	nationalityId: string,
): Customer {
	return {
		nationalityId: nationalityId,
		name: data.name,
		quota: data.quotaRemaining.parent,
		types: data.customerTypes.map((type) => type.name as CustomerType),
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
		agent: data.agen,
	}
}

export function productDTO({ data }: ProductsResponse): Product {
	return {
		id: data.productId,
		name: data.productName,
		stock: {
			available: data.stockAvailable,
			redeem: data.stockRedeem,
		},
	}
}

export function orderDTO(
	{ data }: TransactionResponse,
	customer: Customer,
	quantity: number,
): Order {
	return {
		id: data.transactionId,
		customer: {
			nationalityId: customer.nationalityId,
			name: customer.name,
			quota: customer.quota - quantity,
		},
		product: {
			id: PRODUCT_ID,
			name: PRODUCT_NAME,
			quantity,
		},
	}
}
