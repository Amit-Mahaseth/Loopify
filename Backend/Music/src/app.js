import express from 'express'
import CookieParser from 'cookie-parser'
import  MusicRoutes from './routes/music.route.js'
import cors from 'cors'
const app=express()

app.use(express.json())
app.use(cors({
    origin:"http://localhost:5173",
    withcredentials:true
}))
app.use(CookieParser())
app.use('/api/music',MusicRoutes)

export default app