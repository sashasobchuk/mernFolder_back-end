const express = require("express")
const mongoose = require("mongoose")
const config = require("config")
const fileUpload = require("express-fileupload")
const authRouter  = require("./routes/auth.router")
const fileRouter  = require("./routes/file.routes")
const path = require('path')

const app = express()
/* хероку тикне обо самомі определяєм */
const PORT =  process.env.PORT || config.get("serverPort")
const corsMiddleware = require('./middleware/cors.middleware')
const filePathMiddleware = require('./middleware/filePath.middleware')

app.use(fileUpload({}))
app.use(corsMiddleware)
app.use(filePathMiddleware(path.resolve(__dirname,'files')))
app.use(express.json())
app.use(express.static('static'))

app.use("/api/auth", authRouter)
app.use("/api/files", fileRouter)

const start = async ()=>{
    try{
        await mongoose.connect(config.get("dbUrl"))
    app.listen(PORT, ()=>{
        console.log('server started', PORT)
    })
    }
    catch (e){
        console.log('error 11111111 ',e)
        response('eeee',e)
    }
}

start()








