import mongoose from "mongoose";

const AuthSchema=new  mongoose.Schema({

    email:{
        type:String,
        required:true,
        unique:true
    },
    Fullname:{
        firstname:{
            type:String
        },
        lastname:{
            type:String
        }
    },
        googleid:{
        type:String
    },
    password: {
        type:String,
        required:function(){
            return !this.googleid
        }
    },
    role:{
        type:String,
        enum:['user','artist'],
        default:'user'
    }
    
},{
    timestamps:true
})

const AuthModel=mongoose.model('Auth',AuthSchema)

export default AuthModel