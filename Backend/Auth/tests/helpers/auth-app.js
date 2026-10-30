import {jest} from '@jest/globals'
import {once} from 'node:events'

export const mocks = {
  findOne: jest.fn(),
  create: jest.fn(),
  hash: jest.fn(),
  compare: jest.fn(),
  sign: jest.fn(),
  publish: jest.fn(),
  authenticate: jest.fn(),
  sendEmail: jest.fn()
}

export const googleProfile = {
  id: 'google-123',
  emails: [{value: 'google@example.com'}],
  name: {givenName: 'Google', familyName: 'User'}
}

process.env.JWT_SECRET = 'test-secret'
process.env.GOOGLE_CLIENT_ID = 'test-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret'
process.env.GOOGLE_CALLBACK_URL = 'http://localhost/api/auth/google/callback'
process.env.FRONTEND_URL = 'http://localhost:5173'

await jest.unstable_mockModule('../../src/models/auth.models.js', () => ({
  default: {findOne: mocks.findOne, create: mocks.create}
}))
await jest.unstable_mockModule('bcrypt', () => ({
  default: {hash: mocks.hash, compare: mocks.compare}
}))
await jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {sign: mocks.sign}
}))
await jest.unstable_mockModule('../../src/brokers/rabbitmq.js', () => ({
  PublishToQueue: mocks.publish
}))
await jest.unstable_mockModule('../../src/utils/email.js', () => ({
  default: mocks.sendEmail
}))

const passportModule = await import('passport')
passportModule.default.authenticate = (strategy, options) => {
  mocks.authenticate(strategy, options)
  if (options.session === false) {
    return (req, res, next) => {
      req.user = googleProfile
      next()
    }
  }
  return (req, res) => res.status(200).json({strategy, options})
}

export const {default: app} = await import('../../src/app.js')

let server

export async function startServer() {
  server = app.listen(0)
  await once(server, 'listening')
}

export async function stopServer() {
  if (server) {
    server.close()
    await once(server, 'close')
  }
}

export function request(path, options = {}) {
  const {port} = server.address()
  return fetch(`http://127.0.0.1:${port}${path}`, options)
}