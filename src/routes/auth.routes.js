const { Router } = require("express");
const {
  register,
  login,
  me,
  logout,
} = require("../controllers/auth.controller");
const requireAuth = require("../middlewares/requireAuth");
const crypto = require("crypto");
const random = () => crypto.randomBytes(32).toString("hex");
const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.get("/google", (req, res) => {
  const state = random();
  const nonce = random();
  const codeVerifier = random();
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");

const googleCookieName = "google";
const googleCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 10 * 60 * 1000,
  path: "/api/google",
};

// dans /google :
res.cookie(googleCookieName, JSON.stringify({ state, nonce, codeVerifier }), googleCookieOptions);   

  const { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI } = process.env;
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  res.redirect(url.toString());
});

router.get("/google/callback",  async (req, res) => {
    
});
module.exports = router;
