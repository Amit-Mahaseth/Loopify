import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {mocks, request, startServer, stopServer} from './helpers/auth-app.js'

beforeAll(startServer)
afterAll(stopServer)

test('POST /api/auth/register creates a user and returns a token cookie', async () => {
  const user = {
    _id: 'user-123',
    email: 'person@example.com',
    Fullname: {firstname: 'Test', lastname: 'Person'},
    role: 'user'
  }
  mocks.findOne.mockResolvedValue(null)
  mocks.hash.mockResolvedValue('hashed-password')
  mocks.create.mockResolvedValue(user)
  mocks.sign.mockReturnValue('signed-token')
  mocks.publish.mockResolvedValue(undefined)

  const response = await request('/api/auth/register', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({
      email: user.email,
      password: 'password123',
      Fullname: user.Fullname
    })
  })
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body.msg).toBe('Registration Successfully..')
  expect(body.user.user).toMatchObject(user)
  expect(response.headers.get('set-cookie')).toContain('token=signed-token')
  expect(mocks.hash).toHaveBeenCalledWith('password123', 10)
  expect(mocks.publish).toHaveBeenCalledWith('user_registered', expect.any(Object))
})