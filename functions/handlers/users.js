const { admin, db } = require("../util/admin");
const firebase = require("firebase");

const config = require("../util/config");
firebase.initializeApp(config);

const { validateSignUpData, validateLogInData } = require("../util/validators");

exports.signUp = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  const { valid, errors } = validateSignUpData(newUser);

  if (!valid) return res.status(400).json(errors);

  const noImg = "no-image.png";
  let token, userID;
  db.doc("/users/" + newUser.handle)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res
          .status(400)
          .json({ handle: "unfortunatley the handle is already taken " });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userID = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imgUrl:
          "https://firebasestorage.googleapis.com/v0/b/" +
          config.storageBucket +
          "/o/" +
          noImg +
          "?alt=media",
        userID
      };
      db.doc("/users/" + newUser.handle).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "This email is in use" });
      }
      return res.status(500).json({ error: err.code });
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };

  const { valid, errors } = validateLogInData(user);
  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if ((err.code = "auth/wrong-password")) {
        return res
          .status(403)
          .json({ general: "Wrong password, please try again" });
      }
      return res.status(500).json({ error: err.code });
    });
};

exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });

  let imgName;
  let imgToUpload = {};

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname);
    console.log(filename);
    console.log(mimetype);
    //last item
    const imgExtension = filename.split(".")[filename.split(".").length - 1];

    if (imgExtension != "png" && imgExtension != "jpeg") {
      return res.status(400).json({ error: "Must upload image jpeg or png" });
    }

    console.log(imgExtension);
    const temp = Math.round(Math.random() * 1000000000);
    imgName = temp.toString() + "." + imgExtension;
    console.log(imgName);
    const filePath = path.join(os.tmpdir(), imgName);

    imgToUpload = { filePath, mimetype };

    file.pipe(fs.createWriteStream(filePath));
  });

  busboy.on("finish", () => {
    admin
      .storage()
      .bucket(config.storageBucket)
      .upload(imgToUpload.filePath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imgToUpload.mimetype
          }
        }
      })
      .then(() => {
        //alt media shows the file instead of downloading
        const imgUrl =
          "https://firebasestorage.googleapis.com/v0/b/" +
          config.storageBucket +
          "/o/" +
          imgName +
          "?alt=media";

        console.log(imgUrl);
        return db.doc("/users/" + req.user.handle).update({ imgUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  });

  busboy.end(req.rawBody);
};
