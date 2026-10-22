import express from 'express'
import CookieParser from 'cookie-parser'
import  MusicRoutes from './routes/music.route.js'
import cors from 'cors'
import config from './config/config.js'
const app=express()

app.use(express.json())
app.use(cors({
    origin:config.FRONTEND_URL,
    credentials:true
}))
app.use(CookieParser())
app.use('/api/music',MusicRoutes)
app.use((err, req, res, next) => {
    console.error('Unhandled Music request error:', err)
    if (res.headersSent) return next(err)
    return res.status(500).json({ msg: 'Internal server error' })
})

export default app