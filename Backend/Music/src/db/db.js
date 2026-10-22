import mongoose from "mongoose";
import config  from '../config/config.js'
 export default async function ConnenctToDB(){
await mongoose.connect(config.MONGO_URI)
}
