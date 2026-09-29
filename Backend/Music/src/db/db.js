import mongoose from "mongoose";
import config  from '../config/config.js'
 export default async function ConnenctToDB(){
try{
   
await mongoose.connect(config.MONGO_URI)
console.log("Mongo Db Server Connected")
}
catch(err){
    console.log("Mongo Db Server Error",err)  
}
}

