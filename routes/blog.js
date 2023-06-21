const express = require("express");

const mongodb = require("mongodb");
const db = require("../data/database");
const ObjectId = mongodb.ObjectId;

const router = express.Router();

router.get("/", function (req, res) {
  res.redirect("/posts");
});

router.get("/posts", async function (req, res) {
  const query = `
  SELECT posts.*, authors.name AS author FROM posts 
  INNER JOIN authors ON posts.author_id = authors.id
  `;
  const [posts] = await db.query(query);
  res.render("posts-list", { posts: posts });
});

router.get("/new-post", async function (req, res) {
  // OK
  const authors = await db.getDb().collection("authors").find().toArray();
  res.render("create-post", { authors: authors });
});

router.post("/posts", async function (req, res) {
  // OK
  const authorId = new ObjectId(req.body.author);
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
  console.log(result);
  res.redirect("/posts");
});

router.get("/posts/:id", async function (req, res) {
  const postId = req.params.id;

  const query = `
  SELECT posts.*, authors.name AS author, authors.email AS author_email FROM posts 
  INNER JOIN authors ON posts.author_id = authors.id
  WHERE posts.id = ${postId}
  `;
  const [posts] = await db.query(query);

  if (!posts || posts.length === 0) {
    return res.status(404).render("404");
  }

  const postData = {
    ...posts[0],
    date: posts[0].date.toISOString(),
    humanReadableDate: posts[0].date.toLocaleDateString("en-UK", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };

  res.render("post-detail", { post: postData });
});

router.get("/posts/:id/edit", async function (req, res) {
  const postId = req.params.id;

  const query = `
  SELECT * FROM posts
  WHERE posts.id = ${postId}
  `;
  const [posts] = await db.query(query);

  if (!posts || posts.length === 0) {
    return res.status(404).render("404");
  }

  res.render("update-post", { post: posts[0] });
});

router.post("/posts/:id/edit", async function (req, res) {
  const data = [
    req.body.title,
    req.body.summary,
    req.body.content,
    req.params.id,
  ];
  const query = `
  UPDATE posts SET title = ?, summary = ?, body = ? 
  WHERE id = ?
  `;
  await db.query(query, data);
  res.redirect("/posts");
});

router.post("/posts/:id/delete", async function (req, res) {
  await db.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
  res.redirect("/posts");
});

module.exports = router;
