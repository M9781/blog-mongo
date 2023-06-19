const mysql = require("mysql2/promise");
const fs = require("fs");
const pass = fs.readFileSync("data/pass.txt").toString();

const pool = mysql.createPool({
  host: "localhost",
  database: "blog",
  user: "root",
  password: pass,
});

module.exports = pool;
