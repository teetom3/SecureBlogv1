const { Router } = require("express");
const {
  register,
  login,
  me,
  logout,
  googleStart,
  googleCallback,
  githubStart,
  githubCallback,
} = require("../controllers/auth.controller");
const requireAuth = require("../middlewares/requireAuth");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.get("/google", googleStart);
router.get("/google/callback", googleCallback);
router.get("/github", githubStart);
router.get("/github/callback", githubCallback);

module.exports = router;