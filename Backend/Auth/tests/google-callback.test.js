import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {googleProfile, mocks, request, startServer, stopServer} from './helpers/auth-app.js'

beforeAll(startServer)
afterAll(stopServer)

test('GET /api/auth/google/callback creates a Google user and returns a token cookie', async () => {
  const user = {
    _id: 'google-user-123',
    email: googleProfile.emails[0].value,
    googleid: googleProfile.id,
    Fullname: {firstname: 'Google', lastname: 'User'}
  }
  mocks.findOne.mockResolvedValue(null)
  mocks.create.mockResolvedValue(user)
  mocks.sign.mockReturnValue('google-token')
  mocks.publish.mockResolvedValue(undefined)

  const response = await request('/api/auth/google/callback')
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body.msg).toBe('Google Registration Successful')
  expect(body.user).toMatchObject(user)
  expect(response.headers.get('set-cookie')).toContain('token=google-token')
  expect(mocks.authenticate).toHaveBeenCalledWith('google', {session: false})
  expect(mocks.publish).toHaveBeenCalledWith('user_registered', expect.any(Object))
})