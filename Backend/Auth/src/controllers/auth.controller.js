import AuthModel from '../models/auth.models.js'
import JWT from 'jsonwebtoken'
import config from '../config/config.js'
import bcrypt from 'bcrypt'
import { PublishToQueue } from '../brokers/rabbitmq.js'

export async function RegisterUser(req,res){
try{
    const {email ,password}=req.body
    const {firstname,lastname}=req.body.Fullname
        if (!email || !password || !firstname) {
      return res.status(400).json({
        msg: 'email, password and firstname are required'
      })
    }
console.log('Register request received')
const isuserExist=await AuthModel.findOne(
{email}
)


if(isuserExist){
    return res.status(401).json({
        msg:"user already exist"
    })
}

const passwordHash=await bcrypt.hash(password,10)
const user=await AuthModel.create({
    email,
    password:passwordHash,
    Fullname:{
        firstname,
        lastname
    }
})

const token=JWT.sign({
    id:user._id,
    email:user.email,
    role:user.role
},config.JWT_SECRET,{
    expiresIn:'1d'
})

await PublishToQueue('user_registered',{
    id:user._id,
    email:user.email,   
    Fullname:{
        firstname,
        lastname
    },
    role:user.role
})
res.cookie('token',token,{
    httpOnly:true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
})
return res.status(200).json({
    msg:"Registration Successfully..",
    user:{
        user
    }
})
}
catch(err){
return res.status(500).json({
    msg:"Internal Server Error",
    error:err

})
}
}

export async function GoogleAuthCallback(req, res) {
try{
const user=req.user; 
if (!user?.emails?.[0]?.value || !user?.id) {
    return res.status(400).send('Google account did not provide an email address.')
}
const isUserExist=await AuthModel.findOne({
    $or:[{
email:user.emails[0].value
    },{
googleid:user.id
    }]
})
if(isUserExist){
   
    try {
        await PublishToQueue('user_logged_in',{
            id:isUserExist._id,
            email:isUserExist.email,
            Fullname:{
                firstname:isUserExist.Fullname?.firstname,
                lastname:isUserExist.Fullname?.lastname
            },
            role:isUserExist.role
        })
    } catch (error) {
        console.error('Could not publish Google login event:', error.message)
    }
    const token=JWT.sign({
        id:isUserExist._id,
        email:isUserExist.email,
        role:isUserExist.role
    },config.JWT_SECRET,{
        expiresIn:'1d'
    })

    res.cookie('token',token,{
    httpOnly:true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
})
    return res.redirect('http://localhost:5173/')
}

const newUser=await AuthModel.create({
    email:user.emails[0].value,
    googleid:user.id,   
    Fullname:{
        firstname:user.name.givenName,
        lastname:user.name.familyName
    }
})

const token=JWT.sign({
    id:newUser._id,
    email:newUser.email,
})

res.cookie('token',token,{
    httpOnly:true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    path: '/',
})
try {
    await PublishToQueue('user_registered',{
        id:newUser._id,
        email:newUser.email,
        Fullname:{
            firstname:newUser.Fullname.firstname,
            lastname:newUser.Fullname.lastname
        },
        role:newUser.role
    })
} catch (error) {
    console.error('Could not publish Google registration event:', error.message)
}

return  res.redirect('http://localhost:5173/')

}catch(err){
    return res.status(500).json({
        msg:"Internal Server Error",
        error:err
    })
}
  }

export async function LoginUser(req,res) {
    try{
        const {email,password}=req.body
        const user = await AuthModel.findOne({ email })
        if(!user){
            return res.status(400).json({
                msg:"invalid email or password"
            })
        }

        const isPasswordMatch=await bcrypt.compare(password,user.password)
        if(!isPasswordMatch){
            return res.status(400).json({
                msg:"invalid  password"
            })
        }
        await PublishToQueue('user_logged_in',{
            id:user._id,
            email:user.email,
            Fullname:{
                firstname:user.Fullname.firstname,
                lastname:user.Fullname.lastname
            },
            role:user.role
        })
        const token=JWT.sign({
            userid:user._id,
            email:user.email,
            role:user.role
        },config.JWT_SECRET,{
            expiresIn:'1d'
        })
        res.cookie('token',token,{
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/',
        })


return res.status(200).json({
    msg:'Login Successfully',
    token,
    user
})
    }
    catch(err){
        return res.status(500).json({
        msg:"internal server error ",
        err
        })
    }
}
    


export async function AuthStatus(req, res) {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ authenticated: false })
    try {
        const payload = JWT.verify(token, config.JWT_SECRET)
        const userId = payload.id || payload.userid
        const user = userId
            ? await AuthModel.findById(userId).select('email Fullname role')
            : null
        const email = user?.email || payload.email || ''
        const name = [user?.Fullname?.firstname, user?.Fullname?.lastname]
            .filter(Boolean)
            .join(' ')
        return res.status(200).json({
            authenticated: true,
            user: { name: name || email.split('@')[0], email, role: user?.role || payload.role || 'user' },
        })
    } catch {
        return res.status(401).json({ authenticated: false })
    }
}

export async function GetUser(req, res) {
    try{
        const userId=req.user?.id || req.user?.userid
        if(!userId){
            return res.status(401).json({
                msg:"Unauthorized"
            })
        }
        const user=await AuthModel.findById(userId).select('email Fullname')
        if(!user){
            return res.status(404).json({
                msg:"User not found"
            })
        }
        return res.status(200).json({
            msg:"User Found Successfully",
            user
        })
    }catch(err){
        return res.status(500).json({
            msg:"Internal Server Error",
            error:err
        })
    }
}

export async function UpdateUser(req,res){
    try {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ msg: "Unauthorized" })

    let payload
    try {
        payload = JWT.verify(token, config.JWT_SECRET)
    } catch {
        return res.status(401).json({ msg: "Unauthorized" })
    }

    const userId = payload.id || payload.userid
    if (!userId) return res.status(401).json({ msg: "Unauthorized" })
    const {firstname,lastname}=req.body.Fullname || {}
    const role=req.body.role
    const password=req.body.password    
   const UpdateData=await AuthModel.findOneAndUpdate({_id:userId},{
    ...(firstname && { 'Fullname.firstname': firstname }),
    ...(lastname && { 'Fullname.lastname': lastname }),
    ...(password && { password: await bcrypt.hash(password, 10) }),
    ...(role && { role: role })
}, { new: true }) 

const updatedToken=JWT.sign({
    id:UpdateData._id,
    email:UpdateData.email,
    role:UpdateData.role

}, config.JWT_SECRET, { expiresIn: '1d' })

res.cookie('token', updatedToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax', path: '/' })

return res.status(200).json({
    msg:"user Update Successfully ",
    user:UpdateData
})
}
    catch (err) {
        return res.status(500).json({ msg: 'Unable to update profile', error: err.message })
    }
}
export async function LogoutUser(req,res){
    try{
res.clearCookie('token', { path: '/', sameSite: 'lax' })
return res.status(200).json({
    msg:'Logout Successfully'
})        

    }catch(err){
        return res.status(500).json({
            msg:"Internal server Error",
            errors:err
        })
    }
  }

