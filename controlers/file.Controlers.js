const fileService = require('../services/fileService')
const File = require('../Models/File')
const User = require('../Models/User')
const config = require('config')
const fs = require('fs')
const uuid = require('uuid')

class FileController {
    async createDir(req, res) {
        try {

            const {name, type, parent} = req.body
            const file = new File({name, type, parent, user: req.user.id})
            const parentFile = await File.findOne({_id: parent})
            if (!parentFile) {
                file.path = name
                await fileService.createDir(req,file)
            } else {
                file.path = `${parentFile.path}\\${file.name}`
                await fileService.createDir(req, file)
                parentFile.childs.push(file._id)
                await parentFile.save()
            }
            await file.save()
            return res.json(file)
        } catch (e) {
            console.log(e)
            return res.status(400).json(e)
        }
    }

    async getFiles(req, res) {
        try {
            const {sort} = req.query
            let files
            switch (sort) {
                case 'name':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({name: 1})
                    break
                case 'type':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({type: 1})
                    break
                case 'date':
                    files = await File.find({user: req.user.id, parent: req.query.parent}).sort({date: 1})
                    break
            }
            return res.json(files)

        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'can not get files'})
        }
    }

    async uploadFile(req, res) {
        try {

            const file = req.files.file
            const parent = await File.findOne({user: req.user.id, _id: req.body.parent})
            const user = await User.findOne({_id: req.user.id})


            if (user.usedSpace + file.size > user.diskSpace) {
                return res.status(400).json({message: 'there is non space on disk'})
            }
            user.usedSpace = user.usedSpace + file.size
            let path
            if (parent) {
                path = `${req.filePath}\\${user._id}\\${parent.path}\\${file.name}`

            } else {
                path = `${req.filePath}\\${user._id}\\${file.name}`

            }

            if (fs.existsSync(path)) {
                return res.status(400).json({message: 'its alredy exyst'})
            }
            /* переміщуєм файл*/
            file.mv(path)
            /*щоб прочитати тип файлу розділяєм на спліт і берем останнє*/
            const type = file.name.split('.').pop()
            /* модель файлу збережена в базі даних*/
            let filePath = file.name
            if (parent) {
                filePath = parent.path + '\\' + file.name
            }
            const dbFile = new File({
                name: file.name,
                type: type,
                size: file.size,
                path: filePath,
                parent: parent ? parent._id : null,
                user: user._id
            })
            await dbFile.save()
            await user.save()
            res.json(dbFile)
        } catch (e) {
            console.log(e)
            return res.status(500).json({message: 'upload error 9348'})
        }

    }

    async downloadFile(req, res) {
        try {
            /* шукаєм файл в базі по _id по id що передаватимемо в req  ,
            та перевірятимемо id користувача для безпеки шо получаєм з токена */
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            const path = fileService.getPath(req,file)
            // let path = config.get('filePath')+'\\'+req.user.id + '\\'+file.path + '\\'+file.name
            if (fs.existsSync(path)) {
                return res.download(path, file.name)
            }
            return res.status(400).json({message: 'download error'})
        } catch (e) {
            res.status(500).json({message: 'error download error2'})
            console.log('errror ', e)
        }

    }

    async deletedFile(req, res) {
        try {
            const file = await File.findOne({_id: req.query.id, user: req.user.id})
            if (!file) {
                return res.status(400).json({message: 'file not found'})
            }
            /* удалялє фізично */
            fileService.deleteFile(req,file)
            /* удаляє в базі даних*/
            await file.remove()
            return res.json({message: 'file was deleting'})
        } catch (e) {
            console.log('errror sgdoi3', e)

            res.status(500).json({message: 'is not emty to delete'})
        }

    }

    async searchFile(req, res) {
        try {
            let searchedName = req.query.search

            let allFiles = await File.find({user: req.user.id})
            allFiles = allFiles.filter(file => file.name.includes(searchedName))
            return res.json(allFiles)
        } catch (e) {
            res.json({message: 'error in searching'})
            console.log("in searching", e)
        }
    }

    async uploadAvatar(req, res) {
        try {
            const file = req.files.file
            const user = await User.findById(req.user.id)
            /* v4 генерує рандомну назву*/
            const avatarName = uuid.v4() + '.jpg'
            /* переміщуємо в нашу статік папку */
            file.mv(config.get('staticPath') + '\\' + avatarName)
            /* тикаєм назву аватара в бд*/
            user.avatar = avatarName
            /* зберігаєм содель нового аватара*/
            await user.save()
            /* і вертаєм повідомлення*/
            return res.json({message: 'avatar was upload'})
        } catch (e) {
            console.log(e)
            res.json(user)
        }
    }

    async deleteAvatar(req, res) {
        try {
            const user = await User.findById(req.user.id)
            fs.unlinkSync(config.get('staticPath') + '\\' + user.avatar)
            user.avatar = null
            await user.save()
            return res.json({message: user})
        } catch (e) {
            console.log(e)
            res.json({message: 'error in  delete avatar'})
        }
    }

}

module.exports = new FileController()
