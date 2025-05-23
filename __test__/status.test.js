import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/status', () => {
	it('Should be status 200 OK and show success message', async () => {
		const response = await request(app)
			.get('/api/status')
			.expect(200)
			.expect('Content-type', /json/);

		expect(response.body).toBeDefined();
		expect(response.body).toHaveProperty('success');
		expect(response.body.success).toEqual(true);
		expect(response.body).toHaveProperty('message');
		expect(response.body.message).toEqual('OK');
		expect(response.body).toHaveProperty('environment');
	});
});