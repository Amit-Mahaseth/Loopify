    import {body,validationResult} from 'express-validator'


    async function Validate(req,res,next){
const errors=await validationResult (req)
if(!errors.isEmpty()){
    return res.status(400).json({
        errors:errors.array()
    })
}
    next()
    }

    export const registrationValidationRule=[
        body('email').isEmail().withMessage("invalid email address"),
        body('password').isLength({min:6}).withMessage("pasword must be 6 charater"),
        body('Fullname.firstname').notEmpty().withMessage("first name is required"),
        body('Fullname.lastname').notEmpty().withMessage("last name is required"),
        Validate
    ]



    export const loginValidationRule=[
        body('email').isEmail().withMessage("invalid email address"),
        body('password').notEmpty().withMessage("password is required"),
        Validate
    ]   

    export const updateValidationRule=[
        body('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage("invalid email address"),
        body('Fullname.firstname').notEmpty().withMessage("first name is required"),
        body('Fullname.lastname').notEmpty().withMessage("last name is required"),
        body('password').optional({ nullable: true, checkFalsy: true }).isLength({ min: 6 }).withMessage("password must be at least 6 characters"),
        body('role').optional({ nullable: true, checkFalsy: true }).notEmpty().withMessage("role is required"),
        body('profileImage').optional({ nullable: true, checkFalsy: true }).isURL({ require_protocol: true }).withMessage("profile image must be a valid URL"),
        Validate
    ]
    
    export const forgotPasswordValidationRule=[
        body('email').isEmail().withMessage("invalid email address"),
        Validate
    ]

    export const verifyResetOtpValidationRule=[
        body('email').isEmail().withMessage("invalid email address"),
        body('otp').matches(/^\d{6}$/).withMessage("OTP must be 6 digits"),
        Validate
    ]

    export const resetPasswordValidationRule=[
        body('email').isEmail().withMessage("invalid email address"),
        body('otp').matches(/^\d{6}$/).withMessage("OTP must be 6 digits"),
        body('password').isLength({min:6}).withMessage("password must be at least 6 characters"),
        Validate
    ]
