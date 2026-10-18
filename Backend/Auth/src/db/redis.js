import {createClient} from 'redis'
import Config from '../config/config.js'

const redisClient=createClient({
url:Config.REDIS_URI
})

redisClient.on( "error",(err=>{
    console.error("Raddis Error",err.message)
}))

export default redisClient