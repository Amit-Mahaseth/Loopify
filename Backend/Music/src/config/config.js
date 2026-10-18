import {config as dotenvconfig} from 'dotenv'

dotenvconfig()
 const config={
    MONGO_URI:process.env.MONGO_URI,
    JWT_SECRET:process.env.JWT_SECRET,
    AWS_ACCESS_ID:process.env.AWS_ACCESS_ID,
    AWS_REGION:process.env.AWS_REGION,
    AWS_SECRET_KEY:process.env.AWS_SECRET_ACCESS_KEY,
}

export default config