import { Cookie } from 'puppeteer'

import { Auth, LoginData, LoginResponse } from '@/lib/types'

export function authDTO(response: LoginResponse, cookies: Cookie[]): Auth {
	return {
		cookies,
		accessToken: response.data.accessToken,
		settings: {
			isLogin: response.data.isLogin,
			merchantType: response.data.myptmMerchantType,
			isDefaultPin: response.data.isDefaultPin,
			isNewUser: response.data.isNewUserMyptm,
			isSubsidyProduct: response.data.isSubsidiProduct,
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
