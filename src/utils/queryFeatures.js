export const applyQueryFeatures = (query, queryParams = {}) => {
	const { pagination, sort } = queryParams;
	const { skip, limit } = pagination;

	if(sort) query = query.sort(sort);

	if(limit && limit > 0) {
		query = query.limit(limit);
		if(skip) query = query.skip(skip);
	}
	
	return query;
}