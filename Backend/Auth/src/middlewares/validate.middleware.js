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
        body('email').isEmail().withMessage("invalid email address"),
        body('Fullname.firstname').notEmpty().withMessage("first name is required"),
        body('Fullname.lastname').notEmpty().withMessage("last name is required"),
        body('password').isLength({min:6}).withMessage("pasword must be 6 charater"),
        body('role').notEmpty().withMessage("role is required"),
        Validate
    ]
    