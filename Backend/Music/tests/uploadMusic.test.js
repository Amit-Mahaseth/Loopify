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

const { Uploadfile } = await import('../src/storage/music.storage.service.js')
const MusicModel = (await import('../src/models/music.model.js')).default
const { UploadMusic } = await import('../src/controllers/music.controller.js')

function createResponse() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
}

beforeEach(() => jest.clearAllMocks())

test('uploads music and cover files and creates a music record', async () => {
  const musicFile = { originalname: 'song.mp3', buffer: Buffer.from('audio') }
  const coverImageFile = { originalname: 'cover.jpg', buffer: Buffer.from('image') }
  const createdMusic = { _id: 'music-123', title: 'My Song' }
  Uploadfile.mockResolvedValueOnce('music-key').mockResolvedValueOnce('cover-key')
  MusicModel.create.mockResolvedValue(createdMusic)
  const res = createResponse()

  await UploadMusic({
    files: { music: [musicFile], coverImage: [coverImageFile] },
    body: { title: '  My Song  ' },
    user: { id: 'artist-123', Fullname: { firstname: 'Taylor', lastname: 'Artist' } }
  }, res)

  expect(Uploadfile).toHaveBeenNthCalledWith(1, musicFile)
  expect(Uploadfile).toHaveBeenNthCalledWith(2, coverImageFile)
  expect(MusicModel.create).toHaveBeenCalledWith({
    title: 'My Song', artist: 'Taylor Artist', artistId: 'artist-123',
    musicKey: 'music-key', coverimageKey: 'cover-key'
  })
  expect(res.status).toHaveBeenCalledWith(201)
  expect(res.json).toHaveBeenCalledWith({ msg: 'Music uploaded successfully', music: createdMusic })
})

test('rejects uploads missing required files or title', async () => {
  const res = createResponse()

  await UploadMusic({ files: {}, body: { title: ' ' }, user: {} }, res)

  expect(res.status).toHaveBeenCalledWith(400)
  expect(res.json).toHaveBeenCalledWith({ msg: 'Title, music file, and cover image are required' })
  expect(Uploadfile).not.toHaveBeenCalled()
  expect(MusicModel.create).not.toHaveBeenCalled()
})
