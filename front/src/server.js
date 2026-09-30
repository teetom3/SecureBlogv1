const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const PORT = process.env.PORT || 8080;
const API_URL = process.env.API_URL || 'http://localhost:3000';

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      // en local on est en HTTP : ne pas forcer le HTTPS sur les ressources
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
}));
app.use(morgan('dev'));

// Le navigateur appelle /api/* sur le front, relayé vers l'API :
// même origine → pas de CORS, et le cookie de session reste first-party
app.use(createProxyMiddleware({ target: API_URL, pathFilter: '/api', changeOrigin: true }));

app.use(express.static(path.join(__dirname, 'public')));

// Pages : jamais en cache (sinon "Précédent" après déconnexion ré-affiche le tableau de bord)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

// Récupère l'utilisateur connecté en transmettant le cookie de session à l'API
app.use(async (req, res, next) => {
  res.locals.user = null;
  if (req.headers.cookie) {
    const response = await fetch(`${API_URL}/api/me`, { headers: { cookie: req.headers.cookie } });
    if (response.ok) res.locals.user = (await response.json()).user;
  }
  next();
});

const requireUser = (req, res, next) => (res.locals.user ? next() : res.redirect('/login'));
const requireGuest = (req, res, next) => (res.locals.user ? res.redirect('/') : next());

const formatDate = (date) => new Date(date).toLocaleString('fr-FR', { timeZone: 'Europe/Paris' });

app.get('/', requireUser, async (req, res) => {
  const response = await fetch(`${API_URL}/api/articles`);
  const { articles } = response.ok ? await response.json() : { articles: [] };
  res.render('dashboard', { title: 'Accueil', articles, formatDate });
});

app.get('/articles/:id/edit', requireUser, async (req, res) => {
  const response = await fetch(`${API_URL}/api/articles/${encodeURIComponent(req.params.id)}`);
  if (!response.ok) return res.redirect('/');
  const { article } = await response.json();
  if (article.author.id.toString() !== res.locals.user.id.toString()) return res.redirect('/');
  res.render('edit', { title: 'Modifier l\'article', article });
});

app.get('/login', requireGuest, (req, res) => {
  res.render('login', {
    title: 'Connexion',
    registered: req.query.registered === '1',
    googleError: req.query.error === 'google',
  });
});

app.get('/register', requireGuest, (req, res) => {
  res.render('register', { title: 'Inscription' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(502).render('error', { title: 'Erreur', user: null });
});

app.listen(PORT, () => {
  console.log(`Front running on http://localhost:${PORT} (API: ${API_URL})`);
});
