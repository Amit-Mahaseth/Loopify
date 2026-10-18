import mongoose from "mongoose";

const PlaylistSchema=new mongoose.Schema({
    title:{
        type:String,
        required:true,
        trim:true
    },
    artist:{
        type:String,
    
    },
    artistId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true
    },
    coverImageKey:{
        type:String
    },
    musics:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'music',
        required:true
    }]

},{timestamps:true})

const PlaylistModel=mongoose.model('Playlist',PlaylistSchema)
export default PlaylistModel
