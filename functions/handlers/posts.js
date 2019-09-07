const { db } = require("../util/admin");
exports.getAllPosts = (req, res) => {
  db.collection("Posts")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let posts = [];
      data.forEach(doc => {
        posts.push({
          postID: doc.id,
          body: doc.data().body,
          userHandle: doc.data().userHandle,
          createdAt: doc.data().createdAt
        });
      });

      return res.json(posts);
    })
    .catch(err => console.error(err));
};

exports.postOne = (req, res) => {
  const newPost = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString()
  };

  admin;
  db.collection("Posts")
    .add(newPost)
    .then(doc => {
      res.json({ message: "document " + doc.id + " created succesfully" });
    })
    .catch(err => {
      res.status(500).json({ error: "something went wrong" });
      console.error(err);
    });
};
