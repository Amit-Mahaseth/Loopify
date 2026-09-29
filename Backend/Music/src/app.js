import express from 'express'
import CookieParser from 'cookie-parser'
import * as MusicRoutes from './routes/music.route.js'
const app=express()

app.use(express.json())
app.use(CookieParser())
app.use('/api/music',MusicRoutes)
co
export default app