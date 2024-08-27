export class CustomError extends Error {
	public statusCode: number

	constructor(message: string, statusCode: number) {
		super(message)

		this.statusCode = statusCode
		this.name = this.constructor.name

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor)
		}
	}
}
