import express from 'express'
import multer from 'multer'
import * as  Middlewares from '../middlewares/artist.middleware.js'
import * as MusicController from '../controllers/music.controller.js'
const router=express.Router()

const upload=multer({
    storage:multer.memoryStorage()
})

router.post('/upload',upload.fields([
    {name:'music',maxCount:1},
    {name:'coverImage',maxCount:1}
])
   ,Middlewares.ArtistMiddleware,MusicController.UploadMusic
)
router.get('/artist-music',Middlewares.ArtistMiddleware,MusicController.GetArtistMusic)

router.post('/playlist',Middlewares.ArtistMiddleware,upload.single('coverImage'),MusicController.CreatePlaylist)
router.get('/artist-playlists',Middlewares.ArtistMiddleware,MusicController.GetArtistPlaylists)
router.get('/playlist',Middlewares.AuthMiddleware,MusicController.GetPlaylist)
router.get('/playlist/:id',Middlewares.AuthMiddleware,MusicController.GetPlaylistById)
router.get('/',Middlewares.AuthMiddleware,MusicController.GetAllMusic)
router.get('/:id',Middlewares.AuthMiddleware,MusicController.GetMusicById)

export default router
