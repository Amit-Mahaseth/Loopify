    import JWT from 'jsonwebtoken'
    import config from '../config/config.js'

    import redisClient from '../db/redis.js'
    export async function VerifyToken(req,res,next){
        const token = req.cookies?.token
        if (!token) {
            return res.status(401).json({
                msg: "Unauthorized"
            })
        }

        let decoded
        try {
            decoded = JWT.verify(token, config.JWT_SECRET)
        } catch {
            return res.status(401).json({
                msg: "invalid or expired token",
            })
        }

        let isTokenBlacklisted
        try {
            isTokenBlacklisted = await redisClient.get(`loopify:blacklist:${token}`)
        } catch {
            return res.status(503).json({
                msg: "Authentication service temporarily unavailable",
            })
        }
        if (isTokenBlacklisted) {
            return res.status(401).json({
                msg: "Invalid Token or token has been revoked"
            })
        }

        req.user = decoded
        next()
    }
