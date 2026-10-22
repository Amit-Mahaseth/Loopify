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
const PlaylistModel = (await import('../src/models/playlist.model.js')).default
const { CreatePlaylist, GetArtistPlaylists } = await import('../src/controllers/music.controller.js')

function createResponse() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
}

beforeEach(() => jest.clearAllMocks())

test('creates a playlist without a cover image and returns success', async () => {
  const createdPlaylist = {
    _id: 'playlist-123',
    title: 'My playlist',
    toObject: () => ({ _id: 'playlist-123', title: 'My playlist' })
  }
  PlaylistModel.create.mockResolvedValue(createdPlaylist)
  const res = createResponse()

  await CreatePlaylist({
    body: { title: 'My playlist', musics: ['music-123'] },
    user: { id: 'artist-123', Fullname: { firstname: 'Taylor', lastname: 'Artist' } }
  }, res)

  expect(PlaylistModel.create).toHaveBeenCalledWith({
    title: 'My playlist',
    artist: 'Taylor Artist',
    artistId: 'artist-123',
    musics: ['music-123'],
    coverImageKey: undefined
  })
  expect(PresignedUrl).not.toHaveBeenCalled()
  expect(res.status).toHaveBeenCalledWith(201)
  expect(res.json).toHaveBeenCalledWith({
    msg: 'Playlist created successfully',
    playlist: { _id: 'playlist-123', title: 'My playlist', coverImageUrl: null }
  })
})

test('returns only the authenticated artist playlists', async () => {
  const playlist = {
    artistId: 'artist-123',
    coverImageKey: 'cover-key',
    toObject: () => ({ artistId: 'artist-123', coverImageKey: 'cover-key' })
  }
  PlaylistModel.find.mockResolvedValue([playlist])
  PresignedUrl.mockResolvedValue('https://example.test/cover')
  const res = createResponse()

  await GetArtistPlaylists({ user: { userid: 'artist-123' } }, res)

  expect(PlaylistModel.find).toHaveBeenCalledWith({ artistId: 'artist-123' })
  expect(PresignedUrl).toHaveBeenCalledWith('cover-key')
  expect(res.status).toHaveBeenCalledWith(200)
  expect(res.json).toHaveBeenCalledWith({
    msg: 'Artist playlists fetched successfully',
    playlists: [{ artistId: 'artist-123', coverImageKey: 'cover-key', coverImageUrl: 'https://example.test/cover' }]
  })
})

test('rejects artist playlist requests without an authenticated artist', async () => {
  const res = createResponse()

  await GetArtistPlaylists({ user: {} }, res)

  expect(res.status).toHaveBeenCalledWith(401)
  expect(res.json).toHaveBeenCalledWith({ msg: 'Invalid artist session' })
  expect(PlaylistModel.find).not.toHaveBeenCalled()
})

test('rethrows playlist query errors for centralized error handling', async () => {
  const error = new Error('database unavailable')
  PlaylistModel.find.mockRejectedValue(error)

  await expect(GetArtistPlaylists({ user: { id: 'artist-123' } }, createResponse())).rejects.toBe(error)
})
