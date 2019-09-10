const functions = require("firebase-functions");

const { getAllPosts } = require("./handlers/posts");
const { postOne } = require("./handlers/posts");
const { signUp, login, uploadImage } = require("./handlers/users");

const FBAuth = require("./util/fbAuth");

const express = require("express");
const app = express();

//post routes
app.get("/posts", getAllPosts);

// User route
app.post("/signup", signUp);
app.post("/login", login);

app.post("/posts", FBAuth, postOne);
app.post("/user/image", FBAuth, uploadImage);

exports.api = functions.https.onRequest(app);
