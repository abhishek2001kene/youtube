import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// import bodyParser from "bodyParser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended: true, limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
// app.use(bodyParser.json({type: 'application/*+json'}))



import userRouter from "./routes/user.route.js"
// import userRouter from "./src/routes/user.route.js"

app.use("/api/v1/users", userRouter)





export { app }