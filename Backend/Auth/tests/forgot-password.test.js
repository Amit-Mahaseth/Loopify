import {afterAll, beforeAll, beforeEach, expect, jest, test} from '@jest/globals'
import {mocks, request, startServer, stopServer} from './helpers/auth-app.js'

beforeAll(startServer)
afterAll(stopServer)
beforeEach(() => jest.clearAllMocks())

test('POST /api/auth/forgot-password emails a reset code to the normalized address', async () => {
  const user = {save: jest.fn().mockResolvedValue(undefined)}
  mocks.findOne.mockResolvedValue(user)
  mocks.sendEmail.mockResolvedValue({messageId: 'message-123'})

  const response = await request('/api/auth/forgot-password', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({email: 'Person@Example.com'})
  })
  const body = await response.json()

  expect(response.status).toBe(200)
  expect(body).toMatchObject({success: true, msg: 'OTP sent to your email.'})
  expect(mocks.findOne).toHaveBeenCalledWith({email: 'person@example.com'})
  expect(mocks.sendEmail).toHaveBeenCalledWith(
    'person@example.com',
    'Loopify Password Reset OTP',
    expect.stringMatching(/reset code is \d{6}/)
  )
})

test('POST /api/auth/forgot-password clears the code and reports provider failures', async () => {
  const user = {save: jest.fn().mockResolvedValue(undefined)}
  mocks.findOne.mockResolvedValue(user)
  mocks.sendEmail.mockRejectedValue(new Error('Invalid grant'))

  const response = await request('/api/auth/forgot-password', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({email: 'person@example.com'})
  })
  const body = await response.json()

  expect(response.status).toBe(503)
  expect(body).toMatchObject({success: false})
  expect(user.resetPasswordOTP).toBeNull()
  expect(user.resetPasswordOTPExpires).toBeNull()
  expect(user.save).toHaveBeenCalledTimes(2)
})