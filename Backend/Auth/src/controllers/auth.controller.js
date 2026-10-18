import AuthModel from '../models/auth.models.js'
import JWT from 'jsonwebtoken'
import config from '../config/config.js'
import bcrypt from 'bcrypt'
import { PublishToQueue } from '../brokers/rabbitmq.js'
import crypto from "crypto";
import SendEmail from '../utils/email.js'

import redisClient from '../db/redis.js'
export async function RegisterUser(req, res) {
    try {
        const { email, password, role } = req.body
        const { firstname, lastname } = req.body.Fullname

        if (!email || !password || !firstname) {
            return res.status(400).json({
                msg: 'email, password and firstname are required'
            })
        }
        console.log('Register request received')
        const isuserExist = await AuthModel.findOne(
            { email }
        )


        if (isuserExist) {
            return res.status(409).json({
                msg: "user already exist"
            })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await AuthModel.create({
            email,
            password: passwordHash,
            Fullname: {
                firstname,
                lastname
            }, role
        })

        const token = JWT.sign({
            id: user._id,
            email: user.email,
            Fullname: {
                firstname: user.Fullname.firstname,
                lastname: user.Fullname.lastname
            },
            role: user.role
        }, config.JWT_SECRET, {
            expiresIn: '1d'
        })

        await PublishToQueue('user_registered', {
            id: user._id,
            email: user.email,
            Fullname: {
                firstname,
                lastname
            },
            role: user.role
        })
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/',
        })
        return res.status(201).json({
            msg: "Registration Successfully..",
            user: {
                user
            }
        })
    }
    catch (err) {
        return res.status(500).json({
            msg: "Internal Server Error",
            error: err

        })
    }
}

export async function GoogleAuthCallback(req, res) {
    try {
        const user = req.user;
        if (!user?.emails?.[0]?.value || !user?.id) {
            return res.status(400).send('Google account did not provide an email address.')
        }
        const isUserExist = await AuthModel.findOne({
            $or: [{
                email: user.emails[0].value
            }, {
                googleid: user.id
            }]
        })
        if (isUserExist) {
            const profileImage = user.photos?.[0]?.value
            if (profileImage && profileImage !== isUserExist.profileImage) {
                await AuthModel.findOneAndUpdate(
                    { _id: isUserExist._id },
                    { profileImage },
                    { new: true }
                )
            }

            try {
   
            } catch (error) {
                console.error('Could not publish Google login event:', error.message)
            }
            const token = JWT.sign({
                id: isUserExist._id,
                email: isUserExist.email,
                Fullname: {
                    firstname: isUserExist.Fullname?.firstname,
                    lastname: isUserExist.Fullname?.lastname
                },
                role: isUserExist.role
            }, config.JWT_SECRET, {
                expiresIn: '1d'
            })

            res.cookie('token', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000,
                sameSite: 'lax',
                path: '/',
            })
            return res.redirect(config.FRONTEND_URL)
        }

        const newUser = await AuthModel.create({
            email: user.emails[0].value,
            googleid: user.id,
            Fullname: {
                firstname: user.name.givenName,
                lastname: user.name.familyName
            },
            profileImage: user.photos?.[0]?.value 
        })

        const token = JWT.sign({
            id: newUser._id,
            email: newUser.email,
            Fullname: {
                firstname: newUser.Fullname.firstname,
                lastname: newUser.Fullname.lastname
            },
        })

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/',
        })
        try {
            await PublishToQueue('user_registered', {
                id: newUser._id,
                email: newUser.email,
                Fullname: {
                    firstname: newUser.Fullname.firstname,
                    lastname: newUser.Fullname.lastname
                },
              
            })
        } catch (error) {
            console.error('Could not publish Google registration event:', error.message)
        }

        return res.redirect(config.FRONTEND_URL)

    } catch (err) {
        return res.status(500).json({
            msg: "Internal Server Error",
            error: err.message
        })
    }
}

export async function LoginUser(req, res) {
    try {
        const { email, password } = req.body
        const user = await AuthModel.findOne({ email })
        console.log(user)
        if (!user) {
            return res.status(401).json({
                msg: "invalid email or password"
            })
        }

        if (!user.password) {
    return res.status(401).json({
        msg: "invalid email or password"
    });
}

        const isPasswordMatch = await bcrypt.compare(password, user.password)
        if (!isPasswordMatch) {
            return res.status(401).json({
                msg: "invalid  password"
            })
        }
        const token = JWT.sign({
            id: user._id,
            email: user.email,
            Fullname: {
                firstname: user.Fullname.firstname,
                lastname: user.Fullname.lastname
            },
            role: user.role
        }, config.JWT_SECRET, {
            expiresIn: '1d'
        })
        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'lax',
            path: '/',
        })


        return res.status(200).json({
            msg: 'Login Successfully',
            token,
            user
        })
    }
    catch (err) {
        // console.log(err)
        return res.status(500).json({
            msg: "internal server error ",
            err:err.message
        })
    }
}

export async function GetAllArtist(req,res) {

try{
  
    const Artists=await AuthModel.find({role:"artist"})
        .select('_id email Fullname role profileImage createdAt')
        .lean()
    const artistsWithImageSources = Artists.map((artist) => ({
        ...artist,
        profileImage: normalizeProfileImage(artist.profileImage)
    }))
    return  res.status(200).json({
        msg:"All artist Fetched",
        Artists: artistsWithImageSources
    }   )                                                                                                                                                                   

}catch(err){
    return res.status(500).json({
        msg:"Internal server error"
    })
}
    
}

export async function AuthStatus(req, res) {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ authenticated: false })

    let payload
    try {
        payload = JWT.verify(token, config.JWT_SECRET)
    } catch {
        return res.status(401).json({ authenticated: false })
    }

    try {
        const userId = payload.id || payload.userid
        const user = userId
            ? await AuthModel.findById(userId).select('email Fullname role profileImage')
            : null
        const email = user?.email || payload.email || ''
        const name = [user?.Fullname?.firstname, user?.Fullname?.lastname]
            .filter(Boolean)
            .join(' ')
        const profileImage = normalizeProfileImage(user?.profileImage)
        return res.status(200).json({
            authenticated: true,
            user: {
                name: name || email.split('@')[0],
                email,
                role: user?.role || payload.role || 'user',
                profileImage
            },
        })
    } catch {
        return res.status(500).json({ authenticated: false, msg: 'Unable to check authentication status.' })
    }
}

function normalizeProfileImage(value) {
    if (typeof value !== 'string') return ''
    const trimmedValue = value.trim()
    if (!trimmedValue) return ''
    if (trimmedValue === 'https://www.vecteezy.com/free-vector/default-profile-picture') return ''
    if (/^data:image\/(?:jpeg|png|webp);base64,/i.test(trimmedValue) || /^https?:\/\//i.test(trimmedValue)) return trimmedValue

    const base64Value = trimmedValue.replace(/\s/g, '')
    if (/^\/9j/i.test(base64Value)) return `data:image/jpeg;base64,${base64Value}`
    if (/^iVBORw0KGgo/i.test(base64Value)) return `data:image/png;base64,${base64Value}`
    if (/^UklGR/i.test(base64Value)) return `data:image/webp;base64,${base64Value}`

    return trimmedValue
}

export async function GetUser(req, res) {
    try {
        const userId = req.user?.id || req.user?.userid
        if (!userId) {
            return res.status(401).json({
                msg: "Unauthorized"
            })
        }
        const user = await AuthModel.findById(userId).select('email Fullname profileImage role')
        if (!user) {
            return res.status(404).json({
                msg: "User not found"
            })
        }
        return res.status(200).json({
            msg: "User Found Successfully",
            user: {
                ...user.toObject(),
                profileImage: normalizeProfileImage(user.profileImage)
            }
        })
    } catch (err) {
        return res.status(500).json({
            msg: "Internal Server Error",
            error: err
        })
    }
}

export async function UpdateUser(req, res) {
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
        const { firstname, lastname } = req.body.Fullname || {}
        const role = req.body.role
        const password = req.body.password
        const imageMimeType = req.file ? getProfileImageMimeType(req.file.buffer) : null
        if (req.file && !imageMimeType) {
            return res.status(400).json({ msg: 'The selected file is not a valid JPEG, PNG, or WebP image.' })
        }
        const profileImage = req.file
            ? `data:${imageMimeType};base64,${req.file.buffer.toString('base64')}`
            : undefined
        const UpdateData = await AuthModel.findOneAndUpdate({ _id: userId }, {
            ...(firstname && { 'Fullname.firstname': firstname }),
            ...(lastname && { 'Fullname.lastname': lastname }),
            ...(password && { password: await bcrypt.hash(password, 10) }),
            ...(role && { role: role }),
            ...(profileImage && { profileImage }),
            ...(req.body.removeProfileImage === 'true' && { profileImage: '' })
        }, { new: true })

        if (!UpdateData) {
            return res.status(404).json({ msg: 'User not found' })
        }

        const updatedToken = JWT.sign({
            id: UpdateData._id,
            email: UpdateData.email,
            Fullname: {
                firstname: UpdateData.Fullname.firstname,
                lastname: UpdateData.Fullname.lastname
            },
            role: UpdateData.role

        }, config.JWT_SECRET, { expiresIn: '1d' })

        res.cookie('token', updatedToken, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: 'lax', path: '/' })

        return res.status(200).json({
            msg: "user Update Successfully ",
            user: UpdateData
        })
    }
    catch (err) {
        return res.status(500).json({ msg: 'Unable to update profile', error: err.message })
    }
}

function getProfileImageMimeType(buffer) {
    if (buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png'
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
    if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
    return null
}

export async function LogoutUser(req, res) {
    try {
        const token=req.cookies.token
        const decoded=req.user
        
    if (!token || !decoded?.exp) {
      return res.status(401).json({
        msg: "Unauthorized",
      });
    }

const remainingSecond=Math.floor(
    decoded.exp-Date.now()/1000

)
if(remainingSecond>0){
    try {
      await redisClient.set(
        `loopify:blacklist:${token}`,
        "revoked",
        { EX: remainingSecond}
      );
    } catch {
      return res.status(503).json({
        msg: "Authentication service temporarily unavailable",
      })
    }

}
        res.clearCookie('token', { path: '/', sameSite: 'lax' })
        return res.status(200).json({
            msg: 'Logout Successfully'
        })

    } catch (err) {
        return res.status(500).json({
            msg: "Internal server Error",
            errors: err
        })
    }
}

export async function ForgotPassword(req, res) {
    try {
        const email = req.body.email.trim().toLowerCase()
        const user = await AuthModel.findOne({ email })
        if (!user) return res.status(404).json({ success: false, msg: 'No account found for that email.' })

        const otp = crypto.randomInt(100000, 1000000).toString()
        user.resetPasswordOTP = crypto.createHash('sha256').update(otp).digest('hex')
        user.resetPasswordOTPExpires = new Date(Date.now() + 5 * 60 * 1000)
        await user.save()

        await SendEmail(email, 'Loopify Password Reset OTP', `Your Loopify password reset code is ${otp}. It expires in 5 minutes.`)
        return res.status(200).json({ success: true, msg: 'OTP sent to your email.' })
    } catch (error) {
        console.error('Password reset email failed:', error.message)
        return res.status(500).json({ success: false, msg: 'Could not send the reset code. Please try again.' })
    }
}

export async function VerifyResetOTP(req, res) {
    try {
        const { email, otp } = req.body
        const user = await AuthModel.findOne({ email: email.trim().toLowerCase() })
        if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires || user.resetPasswordOTPExpires <= new Date()) {
            return res.status(400).json({ success: false, msg: 'Reset code is invalid or expired. Request a new code.' })
        }

        const suppliedHash = crypto.createHash('sha256').update(otp).digest('hex')
        const storedHash = Buffer.from(user.resetPasswordOTP, 'hex')
        const candidateHash = Buffer.from(suppliedHash, 'hex')
        if (storedHash.length !== candidateHash.length || !crypto.timingSafeEqual(storedHash, candidateHash)) {
            return res.status(400).json({ success: false, msg: 'That reset code is incorrect.' })
        }

        return res.status(200).json({ success: true, msg: 'Code verified.' })
    } catch (error) {
        return res.status(500).json({ success: false, msg: 'Unable to verify the reset code right now.' })
    }
}

export async function ResetPassword(req, res) {
    try {
        const { email, otp, password } = req.body
        const user = await AuthModel.findOne({ email: email.trim().toLowerCase() })
        if (!user || !user.resetPasswordOTP || !user.resetPasswordOTPExpires || user.resetPasswordOTPExpires <= new Date()) {
            return res.status(400).json({ success: false, msg: 'Reset code is invalid or expired. Request a new code.' })
        }

        const suppliedHash = crypto.createHash('sha256').update(otp).digest('hex')
        const storedHash = Buffer.from(user.resetPasswordOTP, 'hex')
        const candidateHash = Buffer.from(suppliedHash, 'hex')
        if (storedHash.length !== candidateHash.length || !crypto.timingSafeEqual(storedHash, candidateHash)) {
            return res.status(400).json({ success: false, msg: 'Invalid OTP. Please check the code and try again.' })
        }

        user.password = await bcrypt.hash(password, 10)
        user.resetPasswordOTP = null
        user.resetPasswordOTPExpires = null
        await user.save()
        return res.status(200).json({ success: true, msg: 'Password reset successfully. You can now log in with your new password.' })
    } catch (error) {


        return res.status(500).json({ success: false, msg: 'Unable to reset password right now.' })
    }
}
