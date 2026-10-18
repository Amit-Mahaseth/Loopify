import { beforeEach, expect, jest, test } from '@jest/globals'

jest.unstable_mockModule('../src/storage/music.storage.service.js', () => ({
  Uploadfile: jest.fn(),
  PresignedUrl: jest.fn()
}))
jest.unstable_mockModule('../src/models/music.model.js', () => ({
  default: { create: jest.fn(), find: jest.fn() }
}))
jest.unstable_mockModule('../src/models/playlist.model.js', () => ({
  default: { create: jest.fn(), find: jest.fn(), findById: jest.fn() }
}))

const { PresignedUrl } = await import('../src/storage/music.storage.service.js')
const MusicModel = (await import('../src/models/music.model.js')).default
const { GetArtistMusic } = await import('../src/controllers/music.controller.js')

function createResponse() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
}

beforeEach(() => jest.clearAllMocks())

test('returns artist music with signed music and cover URLs', async () => {
  const music = { musicKey: 'music-key', coverimageKey: 'cover-key' }
  MusicModel.find.mockReturnValue({ lean: jest.fn().mockResolvedValue([music]) })
  PresignedUrl.mockResolvedValueOnce('https://example.test/music').mockResolvedValueOnce('https://example.test/cover')
  const res = createResponse()

  await GetArtistMusic({ user: { userid: 'artist-123' } }, res)

  expect(MusicModel.find).toHaveBeenCalledWith({ artistId: 'artist-123' })
  expect(PresignedUrl).toHaveBeenNthCalledWith(1, 'music-key')
  expect(PresignedUrl).toHaveBeenNthCalledWith(2, 'cover-key')
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({
    msg: 'Music fetched successfully',
    musics: [{ ...music, musicUrl: 'https://example.test/music', musicCoverImageUrl: 'https://example.test/cover' }]
  })
})

test('rejects requests without an authenticated artist', async () => {
  const res = createResponse()

  await GetArtistMusic({ user: {} }, res)

  expect(res.status).toHaveBeenCalledWith(401)
  expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid artist session' })
  expect(MusicModel.find).not.toHaveBeenCalled()
})
