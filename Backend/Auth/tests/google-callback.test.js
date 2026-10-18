import {afterAll, beforeAll, expect, test} from '@jest/globals'
import {googleProfile, mocks, request, startServer, stopServer} from './helpers/auth-app.js'

beforeAll(startServer)
afterAll(stopServer)

test('GET /api/auth/google/callback creates a Google user and redirects with a token cookie', async () => {
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

  const response = await request('/api/auth/google/callback', {redirect: 'manual'})

  expect(response.status).toBe(302)
  expect(response.headers.get('location')).toBe('http://localhost:5173')
  expect(response.headers.get('set-cookie')).toContain('token=google-token')
  expect(mocks.authenticate).toHaveBeenCalledWith('google', {session: false})
  expect(mocks.publish).toHaveBeenCalledWith('user_registered', expect.any(Object))
})