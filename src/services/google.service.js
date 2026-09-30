const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { googleClientId, googleClientSecret, googleRedirectUri } = require('../config');
const httpError = require('../utils/httpError');

const googleClient = new OAuth2Client(googleClientId);
const random = () => crypto.randomBytes(32).toString('hex');

// Aller : génère les secrets à usage unique et l'URL de la page de connexion Google
exports.start = () => {
  const state = random();         // anti-CSRF : revient dans l'URL du callback
  const nonce = random();         // anti-rejeu : revient à l'intérieur de l'id_token
  const codeVerifier = random();  // PKCE : prouve à Google que c'est nous qui avons commencé
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', googleClientId);
  url.searchParams.set('redirect_uri', googleRedirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('nonce', nonce);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  return { url: url.toString(), saved: { state, nonce, codeVerifier } };
};

// Retour : vérifie tout et renvoie l'identité Google { sub, email }
exports.callback = async ({ query, saved }) => {
  // 3. anti-CSRF
  if (!saved || typeof query.state !== 'string' || query.state !== saved.state) {
    throw httpError(400, 'state invalide');
  }
  if (typeof query.code !== 'string') throw httpError(400, 'code absent');

  // 4. échange du code contre les tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: query.code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: googleRedirectUri,
      grant_type: 'authorization_code',
      code_verifier: saved.codeVerifier,
    }),
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok) throw httpError(400, `échange du code refusé : ${tokenData.error}`);

  // 5. vérification de l'id_token (signature Google, audience, expiration)
  const ticket = await googleClient.verifyIdToken({ idToken: tokenData.id_token, audience: googleClientId });
  const payload = ticket.getPayload();

  if (payload.nonce !== saved.nonce) throw httpError(400, 'nonce invalide');
  if (payload.email_verified !== true) throw httpError(400, 'email Google non vérifié');

  return { googleId: payload.sub, email: payload.email };
};
