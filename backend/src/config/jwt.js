const jwt = require('jsonwebtoken');

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_EXPIRY  = process.env.JWT_EXPIRES_IN  || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
}

function verifyAccess(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefresh(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

module.exports = { signAccess, signRefresh, verifyAccess, verifyRefresh };
