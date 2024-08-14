import { Cookie } from 'puppeteer'

import {
	LoginData,
	LoginResponse,
	VerifyNationalityIdResponse,
} from '@/lib/responses'
import { Auth, Customer } from '@/lib/types'

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

export function customerDTO({ data }: VerifyNationalityIdResponse): Customer {
	return {
		person: {
			nationalityId: data.nationalityId,
			familyId: data.familyId,
			name: data.name,
			email: data.email,
			phoneNumber: data.phoneNumber,
		},
		quotaRemaining: data.quotaRemaining,
		quotaRemainingLastMonth: data.quotaRemainingLastMonth,
		customerTypes: data.customerTypes,
		channelInject: data.channelInject,
		flags: {
			isAgreedTermsConditions: data.isAgreedTermsConditions,
			isCompleted: data.isCompleted,
			isSubsidy: data.isSubsidi,
		},
	}
}
