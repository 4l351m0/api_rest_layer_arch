export class ApiError extends Error {
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;

		Object.setPrototypeOf(this, new.target.prototype);

		this.name = this.constructor.name;

		if(process.env.NODE_ENV === 'development') {
			Error.captureStackTrace(this, this.constructor);
		} else {
			this.stack = undefined;
		}
	};
}

export class NotFoundError extends ApiError {
	constructor(message = 'Resource not found') {
		super(message, 404);
	}
}

export class ConflictError extends ApiError {
	constructor(message = 'Conflict Error') {
		super(message, 409);
	}
}

export class UnauthorizedError extends ApiError {
	constructor(message = 'Not Authorized') {
		super(message, 401);
	}
}

export class ForbiddenError extends ApiError {
	constructor(message = 'Access Denied') {
		super(message, 403);
	}
}

export class BadRequestError extends ApiError {
	constructor(message = 'Invalid request data', data = null) {
		super(message, 400);
		this.data = data;
	}
}