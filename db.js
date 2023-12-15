"use strict";
/** Database setup for jobly. */
const { Client } = require("pg");
const { DB } = require("./config");

let db;

if (process.env.NODE_ENV === "production") {
  db = new Client({
    /* connectionString: getDatabaseUri(), */
    host: "/var/run/postgresql",
    database: DB,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  db = new Client({
    /* connectionString: getDatabaseUri() */
    host: "/var/run/postgresql",
    database: DB,
  });
}

db.connect();

module.exports = db;