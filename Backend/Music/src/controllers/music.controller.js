import { Uploadfile, PresignedUrl } from '../storage/music.storage.service.js'
import MusicModel from '../models/music.model.js'
import PlaylistModel from '../models/playlist.model.js'

function getArtistId(user) {
    return user?.id || user?.userid || user?._id
}

function getArtistName(user) {
    return [user?.Fullname?.firstname, user?.Fullname?.lastname].filter(Boolean).join(' ')
}

export async function UploadMusic(req, res) {
    try {
        const musicFile = req.files?.music?.[0]
        const coverImageFile = req.files?.coverImage?.[0]
        const artistId = getArtistId(req.user)
        const artist = getArtistName(req.user)

        if (!musicFile || !coverImageFile || typeof req.body.title !== 'string' || !req.body.title.trim()) {
            return res.status(400).json({ msg: 'Title, music file, and cover image are required' })
        }
        if (!artistId || !artist) {
            return res.status(401).json({ msg: 'Invalid artist session' })
        }

        const musicKey = await Uploadfile(musicFile)
        const coverimageKey = await Uploadfile(coverImageFile)
        const music = await MusicModel.create({
            title: req.body.title.trim(),
            artist,
            artistId,
            musicKey,
            coverimageKey
        })

        return res.status(201).json({ msg: 'Music uploaded successfully', music })
    } catch (err) {
        console.error('Music upload failed:', err)
        throw err
    }
}

export async function GetArtistMusic(req, res) {
    try {
        const artistId = getArtistId(req.user)
        if (!artistId) return res.status(401).json({ msg: 'Invalid artist session' })

        const musicDocs = await MusicModel.find({ artistId }).lean()
 const musics=[]
 for(let music of musicDocs){
    music.musicUrl=await PresignedUrl(music.musicKey)
    music.musicCoverImageUrl=await PresignedUrl(music.coverimageKey)
    musics.push(music)
 }

        return res.status(200).json({ msg: 'Music fetched successfully', musics })
    } catch (err) {
        console.error('Fetching artist music failed:', err)
        throw err
    }
}

export async function CreatePlaylist(req, res) {
    try {
        const { title } = req.body
        let { musics } = req.body

        const artistId = getArtistId(req.user)
        const artist = getArtistName(req.user)
        const coverImageKey = req.file ? await Uploadfile(req.file) : undefined
        const playlist = await PlaylistModel.create({ title, artist, artistId, musics, coverImageKey })
        const coverImageUrl = coverImageKey ? await PresignedUrl(coverImageKey) : null

        return res.status(201).json({
            msg: 'Playlist created successfully',
            playlist: {
                ...playlist.toObject(),
                coverImageUrl
            }
        })
    } catch (err) {
        console.error('Playlist creation failed:', err)
        throw err
    }
}

export async function GetAllMusic(req, res) {
    try{
        const musicDocs=await MusicModel.find().lean()
        const musics=[]
        for(let music of musicDocs){
            music.musicUrl=await PresignedUrl(music.musicKey)
            music.musicCoverImageUrl=await PresignedUrl(music.coverimageKey)
            musics.push(music)
         }
        return res.status(200).json({msg:'Music fetched successfully',musics})
    }catch(err){
        console.error('Fetching music failed:', err)
        throw err
    }
}
export async function GetMusicById(req,res){
const {musicId}=req.params.id
try{
    const music=await MusicModel.find({musicId})
    return res.status(200).json({
        msg:"Music Fetched Successfully",
        music
    })

}catch(err){
    throw err
}
}

export async function GetPlaylist(req,res){
    try{
        const playlistDocs=await PlaylistModel.find()
        const playlists=await Promise.all(playlistDocs.map(async playlist => {
            const data=playlist.toObject?.() ?? playlist
            if (data.coverImageKey) data.coverImageUrl=await PresignedUrl(data.coverImageKey)
            return data
        }))
        return res.status(200).json({msg:'Playlists fetched successfully',playlists})
    }catch(err){
        console.error('Fetching playlist failed:', err)
        throw err
    }
}

export async function GetArtistPlaylists(req, res) {
    try {
        const artistId = getArtistId(req.user)
        if (!artistId) return res.status(401).json({ msg: 'Invalid artist session' })

        const playlistDocs = await PlaylistModel.find({ artistId })
        const playlists = await Promise.all(playlistDocs.map(async playlist => {
            const data = playlist.toObject?.() ?? playlist
            if (data.coverImageKey) data.coverImageUrl = await PresignedUrl(data.coverImageKey)
            return data
        }))

        return res.status(200).json({ msg: 'Artist playlists fetched successfully', playlists })
    } catch (err) {
        console.error('Fetching artist playlists failed:', err)
        throw err
    }
}

export async function GetPlaylistById(req,res){
    try{
const {id}=req.params
const playlist=await PlaylistModel.findById(id)
const data=playlist?.toObject?.() ?? playlist
if (data?.coverImageKey) data.coverImageUrl=await PresignedUrl(data.coverImageKey)
return res.status(200).json({msg:'Playlist fetched successfully',playlist:data})
    }catch(err){
        console.error('Fetching playlist by ID failed:', err)
        throw err
    }
}
