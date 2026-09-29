# SecureBlog

Mini-blog Node.js construit avec une attention particulière à la sécurité : authentification par JWT stocké dans un cookie `HttpOnly`, mots de passe hashés avec bcrypt, en-têtes de sécurité HTTP, validation des entrées.

## Architecture

```
Navigateur ──► Front (Express + EJS, :8080) ──/api/*──► API (Express, :3000) ──► MongoDB (:27017)
```

- **Front** (`front/`) : rend les pages EJS et relaie tous les appels `/api/*` vers l'API. Le navigateur ne parle qu'au front, donc tout est sur la même origine : pas de CORS et le cookie reste *first-party*.
- **API** (`src/`) : API REST JSON (authentification, articles).
- **MongoDB** : stockage des utilisateurs et des articles.

## Stack

| Partie | Technologies |
|---|---|
| API | Node.js 22, Express 5, Mongoose, jsonwebtoken, bcrypt, helmet, cookie-parser |
| Front | Express 5, EJS, http-proxy-middleware, helmet |
| Base de données | MongoDB 7 |
| Conteneurs | Docker, Docker Compose |

## Démarrage

### Prérequis
- Docker et Docker Compose
- (sans Docker) Node.js 22+ et une instance MongoDB

### 1. Configurer l'environnement

```bash
cp .env.example .env
```

Puis remplacer au minimum `JWT_SECRET` et `MONGO_INITDB_ROOT_PASSWORD`. Pour générer un secret :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Lancer

**Production :**
```bash
docker compose up --build
```

**Développement** (hot reload, API et MongoDB exposés en local) :
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

L'application est ensuite accessible sur **http://localhost:8080**.

**Sans Docker :**
```bash
npm install && npm run dev                  # API sur :3000
cd front && npm install && npm run dev      # Front sur :8080
```

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `PORT` | Port de l'API | `3000` |
| `NODE_ENV` | `development` ou `production` (active `secure` sur le cookie, masque les erreurs 500) | `development` |
| `MONGO_URI` | URL de connexion MongoDB | — |
| `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` | Identifiants créés au premier lancement du conteneur Mongo | — |
| `JWT_SECRET` | Clé de signature des tokens (**obligatoire**, l'API refuse de démarrer sans) | — |
| `JWT_EXPIRES_IN` | Durée de validité d'un token (`15m`, `1h`, `1d`…) | `1h` |
| `CORS_ORIGIN` | Origine autorisée à appeler l'API directement | `http://localhost:5173` |
| `API_URL` (front) | URL de l'API vue par le front | `http://localhost:3000` |

## API

Toutes les routes sont préfixées par `/api`.

| Méthode | Route | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | — | État du serveur |
| `POST` | `/register` | — | Inscription `{ email, password }` |
| `POST` | `/login` | — | Connexion `{ email, password }`, pose le cookie `token` |
| `GET` | `/me` | ✅ | Utilisateur connecté |
| `POST` | `/logout` | ✅ | Supprime le cookie `token` |
| `GET` | `/articles` | — | 50 derniers articles |
| `POST` | `/articles` | ✅ | Crée un article `{ title, content }` |

## Authentification

1. `POST /api/login` : si les identifiants sont bons, l'API signe un JWT `{ sub: <id utilisateur> }` en **HS256** et le renvoie dans un cookie `token`.
2. Le navigateur renvoie ce cookie automatiquement à chaque requête.
3. Le middleware `requireAuth` vérifie la signature et l'expiration, puis place le payload dans `req.user`. Sinon il répond `401`.

Options du cookie (`src/config/cookie.js`) : `httpOnly`, `sameSite: 'lax'`, `secure` en production, durée 1 h.

> ⚠️ Un JWT ne peut pas être révoqué avant son expiration : après un logout, un token volé reste valide jusqu'à `JWT_EXPIRES_IN`. D'où une durée de vie courte.

## Mesures de sécurité

- **Mots de passe** : hash bcrypt (coût 12), jamais renvoyés dans les réponses (`select: false` + `toJSON`).
- **Anti-énumération** : même temps de réponse au login, que l'email existe ou non (comparaison avec un hash factice).
- **JWT** : algorithme imposé à la vérification (bloque `alg: none` et la confusion d'algorithme), secret obligatoire au démarrage.
- **Cookie** : `HttpOnly` (protège du vol par XSS), `SameSite=Lax` (limite le CSRF), `Secure` en production.
- **En-têtes HTTP** : `helmet` sur l'API et le front (CSP, HSTS…).
- **Entrées** : corps JSON limité à 10 ko, validation des types et du schéma Mongoose.
- **XSS côté front** : échappement EJS (`<%= %>`), messages d'erreur insérés via `textContent`.
- **Erreurs** : message générique pour les erreurs 500 en production.
- **Docker** : conteneurs de prod lancés avec l'utilisateur non-root `node`, ports de dev liés à `127.0.0.1`.

## Structure

```
.
├── src/                    # API
│   ├── config/             # env, base de données, options du cookie
│   ├── controllers/        # lecture de la requête → réponse HTTP
│   ├── middlewares/        # requireAuth, notFound, errorHandler
│   ├── models/             # schémas Mongoose (User, Article)
│   ├── routes/             # déclaration des routes
│   ├── services/           # logique métier
│   ├── utils/              # jwt, httpError
│   ├── app.js              # configuration Express
│   └── server.js           # connexion Mongo + démarrage
├── front/
│   └── src/
│       ├── views/          # templates EJS
│       ├── public/         # CSS et JS navigateur
│       └── server.js       # serveur du front + proxy /api
├── docker-compose.yml      # production
└── docker-compose.dev.yml  # surcharges de développement
```
