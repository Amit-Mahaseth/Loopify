import {config as dotenvconfig} from 'dotenv'

dotenvconfig()

 export const config={
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET
}