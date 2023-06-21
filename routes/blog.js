const express = require("express");

const mongodb = require("mongodb");
const db = require("../data/database");
const ObjectId = mongodb.ObjectId;

const router = express.Router();

router.get("/", function (req, res) {
  res.redirect("/posts");
});

router.get("/posts", async function (req, res) {
  const posts = await db
    .getDb()
    .collection("posts")
    .find()
    .project({ title: 1, summary: 1, "author.name": 1 })
    .toArray();

  res.render("posts-list", { posts: posts });
});

router.get("/new-post", async function (req, res) {
  const authors = await db.getDb().collection("authors").find().toArray();
  res.render("create-post", { authors: authors });
});

router.post("/posts", async function (req, res) {
  let authorId;

  try {
    authorId = new ObjectId(req.params.author);
  } catch (error) {
    return res.status(404).render("404");
  }

  const author = await db
    .getDb()
    .collection("authors")
    .findOne({ _id: authorId });

  const newPost = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
    date: new Date(),
    author: { id: authorId, name: author.name, email: author.email },
  };

  const result = await db.getDb().collection("posts").insertOne(newPost);
  res.redirect("/posts");
});

router.get("/posts/:id", async function (req, res) {
  let postId;

  try {
    postId = new ObjectId(req.params.id);
  } catch (error) {
    return res.status(404).render("404");
  }

  const post = await db
    .getDb()
    .collection("posts")
    .findOne({ _id: postId }, { projection: { summary: 0 } });

  if (!post || post.length === 0) {
    return res.status(404).render("404");
  }

  const postData = {
    ...post,
    date: post.date.toISOString(),
    humanReadableDate: post.date.toLocaleDateString("en-UK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  res.render("post-detail", { post: postData });
});

router.get("/posts/:id/edit", async function (req, res) {
  let postId;

  try {
    postId = new ObjectId(req.params.id);
  } catch (error) {
    return res.status(404).render("404");
  }

  const post = await db
    .getDb()
    .collection("posts")
    .findOne(
      { _id: postId },
      { projection: { title: 1, summary: 1, body: 1 } }
    );

  if (!post || post.length === 0) {
    return res.status(404).render("404");
  }

  res.render("update-post", { post: post });
});

router.post("/posts/:id/edit", async function (req, res) {
  let postId;

  try {
    postId = new ObjectId(req.params.id);
  } catch (error) {
    return res.status(404).render("404");
  }

  const data = {
    title: req.body.title,
    summary: req.body.summary,
    body: req.body.content,
  };

  await db
    .getDb()
    .collection("posts")
    .updateOne({ _id: postId }, { $set: data });
  res.redirect("/posts");
});

router.post("/posts/:id/delete", async function (req, res) {
  let postId;

  try {
    postId = new ObjectId(req.params.id);
  } catch (error) {
    return res.status(404).render("404");
  }

  await db.getDb().collection("posts").deleteOne({ _id: postId });
  res.redirect("/posts");
});

module.exports = router;
