import {config as dotenvConfig} from 'dotenv'

dotenvConfig()

const _Config={

    JWT_SECRET:process.env.JWT_SECRET,
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL:process.env.GOOGLE_CALLBACK_URL,
    GOOGLE_REFRESH_TOKEN:process.env.GOOGLE_REFRESH_TOKEN,
    EMAIL_USER:process.env.EMAIL_USER,
    RABBITMQ_URI:process.env.RABBITMQ_URI

}

export default Object.freeze(_Config)