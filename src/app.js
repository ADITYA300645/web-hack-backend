import express from "express";
import cors from "cors";
import session from 'express-session';
import passport from "passport";
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN
}))


app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(express.static("public")); // configure static file to save images locally

// import controllers
import githubController from './controllers/github.controller.js'
import userController from './controllers/user.controller.js'
import chatController from './controllers/chat.controller.js'
// session middleware to manage user session
app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

//routes
app.use('/auth/github', githubController);  // GitHub authentication and related routes
app.use('/user', userController);
app.use('/chat', chatController);

export {app}
