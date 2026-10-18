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
    profileImage:{
        type:String,
        default:''
    },
    password: {
        type:String,
        required:function(){
            return !this.googleid
        }
    },
    resetPasswordOTP:{
type:String
    },
    resetPasswordOTPExpires:{
type:Date
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