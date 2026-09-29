import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {mocks, request, startServer, stopServer} from './helpers/auth-app.js'

beforeAll(startServer)
afterAll(stopServer)

test('GET /api/auth/google starts Google authentication with profile and email scopes', async () => {
  const response = await request('/api/auth/google')
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body).toEqual({strategy: 'google', options: {scope: ['profile', 'email']}})
  expect(mocks.authenticate).toHaveBeenCalledWith('google', {scope: ['profile', 'email']})
})