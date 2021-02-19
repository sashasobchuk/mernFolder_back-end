const Router = require('express')
const router = new Router()
const authMiddleware  = require('../middleware/auth.middleWare')
const fileController = require('../controlers/file.Controlers')

router.post('',authMiddleware, fileController.createDir)
router.post('/upload',authMiddleware, fileController.uploadFile)
router.get('', authMiddleware, fileController.getFiles)
router.get('/download', authMiddleware, fileController.downloadFile)
router.delete('/', authMiddleware, fileController.deletedFile)
router.get('/search', authMiddleware, fileController.searchFile)
router.post('/avatar',authMiddleware, fileController.uploadAvatar)
router.delete('/avatar', authMiddleware, fileController.deleteAvatar)


module.exports = router







