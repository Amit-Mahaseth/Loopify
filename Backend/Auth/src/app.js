import express from 'express'
import cookieParser from 'cookie-parser'
import AuthRoutes from './routes/auth.routes.js'
import passport from 'passport'
import config from './config/config.js'  
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import * as limiter from './middlewares/rate.limiter.js'
import cors from 'cors'
const app=express()
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())
app.use(limiter.GlobalLimiter)
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials:true
}))
app.use(passport.initialize());

app.use('/api/auth', AuthRoutes)
app.use((err, req, res, next) => {
  console.error('Unhandled Auth request error:', err)
  if (res.headersSent) return next(err)
  return res.status(500).json({ msg: 'Internal Server Error' })
})

passport.use(new GoogleStrategy({
  clientID: config.GOOGLE_CLIENT_ID,
  clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: config.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));



export default app