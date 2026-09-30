const crypto = require('crypto');
const { githubClientId, githubClientSecret, githubRedirectUri } = require('../config');
const httpError = require('../utils/httpError');

const random = () => crypto.randomBytes(32).toString('hex');

const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'secureBlog', // obligatoire pour l'API GitHub
};

// Aller : génère les secrets à usage unique et l'URL de la page d'autorisation GitHub
exports.start = () => {
  const state = random();         // anti-CSRF
  const codeVerifier = random();  // PKCE
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', githubClientId);
  url.searchParams.set('redirect_uri', githubRedirectUri);
  url.searchParams.set('scope', 'read:user user:email');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('allow_signup', 'false');

  // Pas de nonce : GitHub ne fait pas d'OpenID Connect, il n'y a pas d'id_token
  return { url: url.toString(), saved: { state, codeVerifier } };
};

// Retour : vérifie tout et renvoie l'identité GitHub { githubId, email, username }
exports.callback = async ({ query, saved }) => {
  // L'utilisateur a refusé l'autorisation
  if (typeof query.error === 'string') throw httpError(400, `autorisation GitHub refusée : ${query.error}`);

  // anti-CSRF
  if (!saved || typeof query.state !== 'string' || query.state !== saved.state) {
    throw httpError(400, 'state invalide');
  }
  if (typeof query.code !== 'string') throw httpError(400, 'code absent');

  // Échange du code contre un access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code: query.code,
      client_id: githubClientId,
      client_secret: githubClientSecret,
      redirect_uri: githubRedirectUri,
      code_verifier: saved.codeVerifier,
    }),
  });
  const tokenData = await tokenResponse.json();
  // Attention : GitHub renvoie souvent ses erreurs avec un statut 200, d'où le test sur tokenData.error
  if (!tokenResponse.ok || tokenData.error || !tokenData.access_token) {
    throw httpError(400, `échange du code refusé : ${tokenData.error || tokenResponse.status}`);
  }

  const authHeaders = { ...GITHUB_API_HEADERS, Authorization: `Bearer ${tokenData.access_token}` };

  // Profil (pour l'id stable et le login)
  const userResponse = await fetch('https://api.github.com/user', { headers: authHeaders });
  if (!userResponse.ok) throw httpError(502, 'profil GitHub inaccessible');
  const user = await userResponse.json();

  // Emails : le champ email du profil est souvent null (email privé)
  const emailsResponse = await fetch('https://api.github.com/user/emails', { headers: authHeaders });
  if (!emailsResponse.ok) throw httpError(502, 'emails GitHub inaccessibles');
  const emails = await emailsResponse.json();

  const primary = emails.find((e) => e.primary && e.verified);
  if (!primary) throw httpError(400, 'aucun email GitHub principal vérifié');

  return {
    githubId: String(user.id), // l'id numérique est stable, contrairement au login qui peut changer
    email: primary.email,
    username: user.login,
  };
};