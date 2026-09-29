import express from 'express'
import * as AuthController from '../controllers/auth.controller.js'
import * as Validation from '../middlewares/validate.middleware.js'
import passport from 'passport'
import * as limiter from '../middlewares/rate.limiter.js'
import * as AuthMiddleware from '../middlewares/auth.middleware.js'
const router =express.Router()

router.post('/register',limiter.AuthLimiter,Validation.registrationValidationRule,AuthController.RegisterUser)
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
router.post('/update',AuthMiddleware.VerifyToken,Validation.updateValidationRule,AuthController.UpdateUser)

export default router
