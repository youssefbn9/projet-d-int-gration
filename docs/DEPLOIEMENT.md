# Guide de Déploiement en Production StockPro (Sans Docker)

Ce guide décrit la procédure pas à pas pour déployer l'application **StockPro** sur des plateformes PaaS managées sans conteneurisation (Render/Railway pour l'API, Vercel pour le Frontend React, et un service MySQL managé).

---

## 1. Ordre de Déploiement Strict

Pour garantir la disponibilité immédiate de chaque service, le déploiement doit être effectué dans l'ordre suivant :
1. **Base de données MySQL managée** (Railway, PlanetScale, Aiven ou Clever Cloud).
2. **API Backend Express.js** (Render ou Railway).
3. **Frontend SPA React Vite** (Vercel).

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Vercel      │ ----> │ Render / Railway│ ----> │  Managed MySQL  │
│ (React + Vite)  │  API  │   (Express.js)  │  SQL  │  (8.0 + SSL)    │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 2. Étape 1 : Base de Données MySQL Managée

### A. Création de l'instance
1. Créez un projet sur **Railway** (ou **Aiven**, **Clever Cloud**).
2. Ajoutez un plugin ou service **MySQL Database**.
3. Récupérez les identifiants de connexion :
   - `DB_HOST` (nom d'hôte distant)
   - `DB_PORT` (généralement 3306 ou port attribué)
   - `DB_USER` (utilisateur administrateur)
   - `DB_PASSWORD` (mot de passe généré)
   - `DB_NAME` (nom de la base, ex: `railway`)

### B. Initialisation du schéma
Exécutez le script SQL de production conçu spécifiquement sans instruction `CREATE DATABASE` ni `USE` :
- Fichier source : `server/sql/schema.production.sql`
- Via l'interface SQL de Railway, phpMyAdmin distant ou en ligne de commande :
  ```bash
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p $DB_NAME < server/sql/schema.production.sql
  ```

### C. Peuplement initial (Seed Démo 60 jours)
Depuis votre machine locale, renseignez temporairement les accès distants dans `server/.env` puis lancez :
```bash
npm --prefix server run seed
```
Le script insérera l'entreprise « Épicerie Demo », ses comptes admin (`admin@demo.tn` / `Admin123`), staff, ses 20 produits et 60 jours de ventes.

---

## 3. Étape 2 : API Backend Express (Render ou Railway)

### A. Configuration sur Render (Web Service)
1. Cliquez sur **New +** > **Web Service**.
2. Connectez votre dépôt GitHub `https://github.com/youssefbn9/projet-d-int-gration`.
3. Configurez les paramètres d'environnement :
   - **Root Directory** : `server`
   - **Environment** : `Node`
   - **Build Command** : `npm ci`
   - **Start Command** : `npm start`
   - **Instance Type** : `Free` ou `Starter`

### B. Variables d'environnement Backend
Dans l'onglet **Environment Variables**, ajoutez :

| Variable | Exemple / Valeur requise | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Mode d'exécution sécurisé |
| `PORT` | `10000` (ou fourni par Render) | Port d'écoute du serveur HTTP |
| `DB_HOST` | `mon-cluster.railway.internal` | Hôte MySQL distant |
| `DB_PORT` | `3306` | Port de la base de données |
| `DB_USER` | `root` | Utilisateur MySQL |
| `DB_PASSWORD` | `secret123` | Mot de passe MySQL |
| `DB_NAME` | `railway` | Nom de la base managée |
| `DB_SSL` | `true` | Active la connexion chiffrée SSL |
| `JWT_SECRET` | *(chaîne aléatoire $\ge 32$ car.)* | Clé de signature des tokens |
| `JWT_EXPIRES_IN` | `24h` | Durée de validité du jeton |
| `CLIENT_URL` | `https://stockpro.vercel.app` | URL du frontend pour les headers CORS |

### C. Validation de l'API
Une fois le déploiement terminé, ouvrez dans votre navigateur :
`https://votre-api.onrender.com/api/health`
Réponse attendue :
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected",
    "uptime": 45
  }
}
```

---

## 4. Étape 3 : Frontend React SPA (Vercel)

### A. Déploiement sur Vercel
1. Rendez-vous sur le dashboard **Vercel** > **Add New Project**.
2. Importez le dépôt `projet-d-int-gration`.
3. Configurez les options du build :
   - **Root Directory** : cliquez sur *Edit* et sélectionnez le dossier `client`.
   - **Framework Preset** : `Vite` (détecté automatiquement).
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`
   - **Install Command** : `npm ci`

### B. Variables d'environnement Frontend
Dans la section **Environment Variables** :

| Variable | Exemple / Valeur | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://votre-api.onrender.com/api` | URL complète de l'API déployée |

### C. Support du routage SPA
Le fichier `client/vercel.json` présent à la racine du client assure la réécriture de toutes les routes vers `/index.html` pour éviter les erreurs 404 lors des rafraîchissements de page (`/produits`, `/ventes`, etc.).

---

## 5. Vérification Finale de l'Application Déployée

1. Ouvrez l'URL Vercel du frontend (`https://stockpro.vercel.app`).
2. Connectez-vous avec le compte de démonstration :
   - **Email** : `admin@demo.tn`
   - **Mot de passe** : `Admin123`
3. Vérifiez le chargement immédiat du **Dashboard** (chiffre d'affaires, graphiques Recharts, alertes de rupture).
4. Rendez-vous sur **Ventes** et effectuez une nouvelle transaction :
   - Le stock du produit sélectionné diminue instantanément dans **Produits**.
5. Rendez-vous sur **Prévisions** pour visualiser les projections à J+7 calculées par la régression linéaire.

