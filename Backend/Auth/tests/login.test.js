import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {mocks, request, startServer, stopServer} from './helpers/auth-app.js'

beforeAll(startServer)
afterAll(stopServer)

test('POST /api/auth/login authenticates a user and returns a token cookie', async () => {
  const user = {
    _id: 'user-123',
    email: 'person@example.com',
    password: 'hashed-password',
    Fullname: {firstname: 'Test', lastname: 'Person'},
    role: 'user'
  }
  mocks.findOne.mockResolvedValue(user)
  mocks.compare.mockResolvedValue(true)
  mocks.sign.mockReturnValue('signed-token')
  mocks.publish.mockResolvedValue(undefined)

  const response = await request('/api/auth/login', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({email: user.email, password: 'password123'})
  })
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body.msg).toBe('Login Successfully')
  expect(body.user).toMatchObject({email: user.email})
  expect(response.headers.get('set-cookie')).toContain('token=signed-token')
  expect(mocks.compare).toHaveBeenCalledWith('password123', 'hashed-password')
  expect(mocks.publish).toHaveBeenCalledWith('user_logged_in', expect.any(Object))
})