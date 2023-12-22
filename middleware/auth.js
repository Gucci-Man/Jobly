"use strict";

/** Convenience middleware to handle common auth cases in routes. */

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError} = require("../expressError");


/** Middleware: Authenticate user.
 *
 * If a token was provided, verify it, and, if valid, store the token payload
 * on res.locals (this will include the username and isAdmin field.)
 *
 * It's not an error if no token was provided or if the token is not valid.
 */

function authenticateJWT(req, res, next) {
  try {
    const authHeader = req.headers && req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^[Bb]earer /, "").trim();
      res.locals.user = jwt.verify(token, SECRET_KEY);
    
      //console.log(`res.local.user in JWT function ${decoded}`);
    }
    return next();
  } catch (err) {
    return next();
  }
}

/** Middleware to use when they must be logged in and is an admin.
 *
 * If not, raises Unauthorized.
 */

function ensureLoggedIn(req, res, next) {
  try {
    // If user token not stored in res or is not an admin, throw error
    if (!res.locals.user || res.locals.user.isAdmin === false) {
      throw new UnauthorizedError();
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Middleware to use when they must be an admin or the user of the requested account.
 *
 * If not, raises Unauthorized.
 */

function ensureUserOrAdmin(req, res, next) {
  try {
    // check if username query exist, if not, throw error
    if (!req.params.username){
      throw new UnauthorizedError('Missing username parameter');
    }
    // Access authenticated user information
    const user = res.locals.user;
    // If user token not stored in res or is not an admin, throw error
    if (req.params.username === user.username || user.isAdmin === true) {
      return next();
    }
    throw new UnauthorizedError();
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  authenticateJWT,
  ensureLoggedIn,
  ensureUserOrAdmin,
};
