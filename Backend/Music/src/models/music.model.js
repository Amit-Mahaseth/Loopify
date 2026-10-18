import mongoose  from "mongoose";

const MusicSchema= new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    artist:{
        type:String,
        required:true
    },
    artistId:{
        type:mongoose.Schema.Types.ObjectId
    },
    musicKey:{
        type:String,
        required:true
    },
    coverimageKey:{
        type:String,
         required:true
    }
},{timestamps:true})

const music=mongoose.model('music',MusicSchema)

export default music