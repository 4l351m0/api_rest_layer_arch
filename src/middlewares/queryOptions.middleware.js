
export const queryOptions = (req, res, next) => {
	try {
		const queryParams = req.query;
		const filter = { ...queryParams };

		const specialParams = ['page', 'limit', 'sort'];

		specialParams.forEach(param => delete filter[param]);

		const page = parseInt(queryParams.page, 10) || 1;
		const limit = parseInt(queryParams.limit, 10) || 25;

		const skip = (page -1) * limit;
		const sort = queryParams.sort;

		const queryOptions = {
			filter,
			pagination: {
				page,
				limit,
				skip
			},
			sort
		}

		req.queryOptions = queryOptions;
		next();

	} catch (error) {
		logger.error(
			'[QueryOptions Middleware] Error processing query parameters',
			{
				error: error.message,
				stack: error.stack,
				query: req.query
			}
		);

		next(error);
	}
}