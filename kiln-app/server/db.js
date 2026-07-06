// Minimal file-backed datastore.
//
// This is intentionally simple so the project runs with zero external
// services. It is FINE for prototyping and small user counts. Before real
// users and money are involved at scale, swap this for Postgres/MySQL/Mongo —
// the shape of the functions below (getUserByEmail, createUser, addCredits,
// deductCredit) is exactly what you'd reimplement against a real DB, so the
// rest of the app doesn't need to change.

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data.json');

function load() {
  if (!fs.existsSync(DB_PATH)) {
    save({ users: [], usage: [] });
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  if (!db.usage) db.usage = []; // migrate older data.json files
  return db;
}

function save(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getUserByEmail(email) {
  const db = load();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  const db = load();
  return db.users.find(u => u.id === id);
}

function createUser({ id, email, passwordHash, startingCredits }) {
  const db = load();
  const user = {
    id,
    email,
    passwordHash,
    credits: startingCredits,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  save(db);
  return user;
}

function addCredits(userId, amount) {
  const db = load();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  user.credits += amount;
  save(db);
  return user;
}

function deductCredit(userId, amount = 1) {
  const db = load();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  if (user.credits < amount) return { insufficient: true, user };
  user.credits -= amount;
  save(db);
  return { insufficient: false, user };
}

/* ---------------- Password reset ---------------- */

function setResetToken(email, token, expiresAt) {
  const db = load();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return null;
  user.resetToken = token;
  user.resetTokenExpiresAt = expiresAt; // ms since epoch
  save(db);
  return user;
}

function getUserByResetToken(token) {
  const db = load();
  const user = db.users.find(u => u.resetToken === token);
  if (!user) return null;
  if (!user.resetTokenExpiresAt || Date.now() > user.resetTokenExpiresAt) return null;
  return user;
}

function updatePassword(userId, passwordHash) {
  const db = load();
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;
  user.passwordHash = passwordHash;
  user.resetToken = null;
  user.resetTokenExpiresAt = null;
  save(db);
  return user;
}

/* ---------------- Usage log ---------------- */

function addUsageEntry(entry) {
  const db = load();
  db.usage.push(entry);
  save(db);
}

function getUsageForUser(userId) {
  const db = load();
  return db.usage
    .filter(u => u.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = {
  getUserByEmail,
  getUserById,
  createUser,
  addCredits,
  deductCredit,
  setResetToken,
  getUserByResetToken,
  updatePassword,
  addUsageEntry,
  getUsageForUser,
};
