import express from 'express'
import * as AuthController from '../controllers/auth.controller.js'
import * as Validation from '../middlewares/validate.middleware.js'
import passport from 'passport'
import * as limiter from '../middlewares/rate.limiter.js'
import * as AuthMiddleware from '../middlewares/auth.middleware.js'
import multer from 'multer'
const router =express.Router()
const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error('Please select a JPEG, PNG, or WebP image.'))
    }
    callback(null, true)
  }
}).single('profileImage')

function handleProfileImageUpload(req, res, next) {
  profileImageUpload(req, res, (error) => {
    if (error) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'Profile image must be 1 MB or smaller.'
        : error.message || 'Unable to upload profile image.'
      return res.status(400).json({ msg: message })
    }
    next()
  })
}

router.post('/register',Validation.registrationValidationRule,AuthController.RegisterUser)
router.get('/google', limiter.AuthLimiter,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.post('/login',limiter.AuthLimiter,Validation.loginValidationRule,AuthController.LoginUser)
router.get('/status',AuthController.AuthStatus)
router.post('/logout',AuthMiddleware.VerifyToken,AuthController.LogoutUser)
router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  AuthController.GoogleAuthCallback
);
router.get('/getuser',AuthMiddleware.VerifyToken,AuthController.GetUser)
router.get('/artist',AuthMiddleware.VerifyToken,AuthController.GetAllArtist)
router.post('/update',AuthMiddleware.VerifyToken,handleProfileImageUpload,Validation.updateValidationRule,AuthController.UpdateUser)
router.post('/forgot-password',limiter.AuthLimiter,Validation.forgotPasswordValidationRule,AuthController.ForgotPassword)
router.post('/verify-reset-otp',limiter.AuthLimiter,Validation.verifyResetOtpValidationRule,AuthController.VerifyResetOTP)
router.post('/reset-password',limiter.AuthLimiter,Validation.resetPasswordValidationRule,AuthController.ResetPassword)
export default router
