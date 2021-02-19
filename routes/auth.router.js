const Router = require("express")

const User = require("../Models/User")
const bcrypt = require("bcryptjs")
const jwt  = require("jsonwebtoken")
const config = require("config")
const router = new Router()
const {check, validationResult} = require('express-validator')
const authMiddleware = require('../middleware/auth.middleWare')
const fileService = require('../services/fileService')
const File = require('../Models/File')

router.post('/registration',
    [
        check('email', "Uncorrect email").isEmail(),
        check('password', 'Password must be longer than 3 and shorter than 12').isLength({min:3, max:12})
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                return res.status(400).json({message: "Uncorrect request", errors})
            }
            const {email, password} = req.body
            const candidate = await User.findOne({email})
            if(candidate) {
                return res.status(400).json({message: `User with email ${email} already exist`})
            }
            const hashPassword = await bcrypt.hash(password, 8)
            const user = new User({email, password: hashPassword})
            await user.save()
            await fileService.createDir(req, new File({user:user.id, name: ''}))
            res.json({message: "User was created"})
        } catch (e) {
            console.log(e)
            res.send({message: "Server error"})
        }
    })
router.post('/login',

    async (req, res) => {
        try {
            const {email, password} = req.body
            /* шукаєм юзера в базі даних tru or false вертається*/
            const user  = await User.findOne({email})
            if (!user){
                return res.status(404).json({message:`user ${email} not foundb`})
            }
             /* перевіряє співпадіння паролів tru or false*/
            const isPassValid = bcrypt.compareSync(password, user.password)
            if(!isPassValid){
                return res.status(400).json({message:'pasword not falid'})
            }
            /*  створ.єм токен деперший параметр ід другий секретний ключ
            * третій скільки юуде існувати*/
            const token = jwt.sign({id:user.id},config.get("secretKey"),{expiresIn: "10h"})

            return res.json({
                token,
                user:{
                    id:user.id,
                    email:user.email,
                    diskSpace:user.diskSpace,
                    usedSpace:user.usedSpace,
                    avatar:user.avatar
                }
            })

        } catch (e) {
            console.log(e)
            res.send({message: 'server error 98423948'})
        }
    })

    router.get('/auth', authMiddleware,

    async (req, res) => {
        try {
            const user = await User.findOne({_id:req.user.id})
            const token = jwt.sign({id:user.id},config.get("secretKey"),{expiresIn: "10h"})

            return res.json({
                token,
                user:{
                    id:user.id,
                    email:user.email,
                    diskSpace:user.diskSpace,
                    usedSpace:user.usedSpace,
                    avatar:user.avatar
                }
            })
        } catch (e) {
            console.log(e)
            res.send({message: 'server error 98423948'})
        }
    })

module.exports = router