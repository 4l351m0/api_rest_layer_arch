import swaggerJSDoc from "swagger-jsdoc";

const options = {
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'API REST de Blog',
			version: '1.0.0',
			description: 'This API REST includes user managament, posts, comments and likes with authentication process and token verification',
			contact: {
				name: 'Daniel Sandoval',
				email: 'alesim097sm@gmail.com'
			},
		},
		servers: [
			{
				url: 'http://localhost:3000',
				description: 'Local Development Server'
			}
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
					description: 'Introduce JWT token (Bearer Token) to access the protected endpoints'
				}
			},
			schemas: {
				User: {
					type: 'object',
					properties: {
						_id: { 
							type: 'string',
							description: 'User ID'
						},
						name: {
							type: 'string',
							description: 'User Name'
						},
						email: {
							type: 'string',
							description: 'User Email'
						},
						role: {
							type: 'string',
							description: 'User Role'
						},
						isActive: {
							type: 'boolean',
							description: 'User Status'
						},
						createdAt: {
							type: 'string',
							format: 'date-time'
						},
						updatedAt: {
							type: 'string',
							format: 'date-time'
						}
					}
				},

				Post: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
							description: 'Post ID'
						},
						title: {
							type: 'string',
							description: 'Post Title'
						},
						body: {
							type: 'string',
							description: 'Post Body'
						},
						author: {
							type: 'string',
							description: 'Post Author'
						},
						likesCount: {
							type: 'number',
							description: 'Post Likes',
							default: 0
						},
						createdAt: {
							type: 'string',
							format: 'date-time'
						},
						updatedAt: {
							type: 'string',
							format: 'date-time'
						}
					}
				},

				Comment: {
					type: 'object',
					properties: {
						_id: {
							type: 'string',
							description: 'Comment ID'
						},
						text: {
							type: 'string',
							description: 'Comment Content'
						},
						author: {
							type: 'string',
							description: 'Comment Author ID'
						},
						post: {
							type: 'string',
							description: 'Comment Post ID'
						},
						createdAt: {
							type: 'string',
							format: 'date-time'
						},
						updatedAt: {
							type: 'string',
							format: 'date-time'
						}
					}
				}
			}
		},
	},
	apis: [
		'./src/docs/*.yml',
	]
}

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;