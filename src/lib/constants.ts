export const DEFAULT_TIMEOUT = 3 * 60 * 1000

export const LOGIN_URL =
	'https://subsiditepatlpg.mypertamina.id/merchant/auth/login'
export const VERIFY_CUSTOMER_URL =
	'https://subsiditepatlpg.mypertamina.id/merchant/app/verification-nik'
export const MANAGE_PRODUCT_URL =
	'https://subsiditepatlpg.mypertamina.id/merchant/app/manage-product'

export const LOGIN_ENDPOINT =
	'https://api-map.my-pertamina.id/general/v1/users/login'
export const VERIFY_CUSTOMER_ENDPOINT =
	'https://api-map.my-pertamina.id/customers/v1/verify-nik'
export const PROFILE_ENDPOINT =
	'https://api-map.my-pertamina.id/general/v1/users/profile'
export const PRODUCTS_ENDPOINT =
	'https://api-map.my-pertamina.id/general/v2/products'
export const TRANSACTIONS_ENDPOINT =
	'https://api-map.my-pertamina.id/general/v1/transactions'

export const PRODUCT_ID = 'e2f29f10-686e-4140-9c92-4d2103357544'
export const PRODUCT_NAME = 'LPG 3 Kg'
export const USER_DATA_LOCAL_STORAGE_KEY = 'maplite_user_data'
export const MY_PERTAMINA_DELAY = 60 * 1000

export const CUSTOMER_TYPES = [
	'Rumah Tangga',
	'Usaha Mikro',
	'Pengecer',
] as const
