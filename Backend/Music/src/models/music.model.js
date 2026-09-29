import mongoose  from "mongoose";

const MusicSchema= new mongoose.Schema({
    title:{
        type:String,
        required:true
    },
    Artist:{
        type:String
    },
    ArtistId:{
        type:mongoose.Schema.ObjectId
    },
    musicKey:{
        type:String
    },
    coverimageKey:{
        type:String
    }
},{timestamps:true})

const music=mongoose.model('music',MusicSchema)

export default music