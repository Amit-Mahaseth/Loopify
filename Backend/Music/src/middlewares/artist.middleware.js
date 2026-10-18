import JWT from 'jsonwebtoken'
import config from '../config/config.js'

export async function ArtistMiddleware(req,res,next){
    try{
    const token=req.cookies.token
    if(!token){
        return res.status(400).json({
            msg:"Unauthorized"
        })
    }
    const decoded = JWT.verify(token, config.JWT_SECRET)
    
    if(decoded.role !== "artist"){
        return res.status(403).json({
            msg:"You are not an artist"
        })
    }
    req.user = decoded
    next()
}
catch(err){
    return res.status(401).json({
        msg:"invalid or expired token",
    })
}
}

export async function AuthMiddleware(req,res,next){
    try{
    const token=req.cookies.token
    if(!token){
        return res.status(400).json({
            msg:"Unauthorized"
        })
    }
    const decoded = JWT.verify(token, config.JWT_SECRET)
    req.user = decoded
    next()
}
catch(err){
    return res.status(401).json({
        msg:"invalid or expired token",
    })
}
}