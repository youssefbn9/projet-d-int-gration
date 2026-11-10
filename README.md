# StockPro — Solution SaaS de Gestion Commerciale, Stock & Prévisions ML

[![CI/CD Pipeline](https://github.com/youssefbn9/projet-d-int-gration/actions/workflows/ci.yml/badge.svg)](https://github.com/youssefbn9/projet-d-int-gration/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

> Plateforme SaaS multi-commerces complète : encaissement transactionnel (`SELECT FOR UPDATE`), traçabilité des stocks, CRM clients & fournisseurs, tableau de bord analytique et **module de prévision des ventes par régression linéaire sans bibliothèque ML externe**.

---

## 🌐 Démo en Ligne

| Service | Plateforme | URL de Démonstration |
| :--- | :--- | :--- |
| **Frontend Web** | Vercel | [https://stockpro.vercel.app](https://stockpro.vercel.app) *(lien à compléter)* |
| **API Backend** | Render / Railway | [https://stockpro-api.onrender.com](https://stockpro-api.onrender.com) *(lien à compléter)* |
| **Documentation Swagger** | Swagger UI | [https://stockpro-api.onrender.com/api/docs](https://stockpro-api.onrender.com/api/docs) *(lien à compléter)* |
| **Healthcheck API** | Render / Railway | [https://stockpro-api.onrender.com/api/health](https://stockpro-api.onrender.com/api/health) *(lien à compléter)* |

---

## 🚀 Fonctionnalités Clés

1. **Architecture Multi-Commerces Sécurisée** :
   - Isolation stricte au niveau de chaque table (`company_id`).
   - Aucune fuite d'information inter-commerces (réponse systématique en `404` si la ressource demandée n'appartient pas au commerce de l'utilisateur).
   - Authentification JWT avec hachage bcrypt (10 rounds) et politique stricte sur les mots de passe.
2. **Gestion Transactionnelle des Ventes (`SELECT FOR UPDATE`)** :
   - Décrémentation atomique du stock avec verrouillage pessimiste.
   - Refus immédiat `409 INSUFFICIENT_STOCK` avec rollback complet si le stock disponible est insuffisant.
   - Calcul des montants et sous-totaux certifié côté serveur.
   - Annulation de vente transactionnelle avec **restitution automatique du stock** et génération des mouvements de réintégration (`'in'`).
3. **Module Prédictif & Intelligence Artificielle (JS Pur)** :
   - Algorithme de régression linéaire par la méthode des moindres carrés ordinaires (OLS) sans dépendance Python/ML.
   - Analyse de la tendance des ventes sur les 30 derniers jours (avec complétion des jours sans vente).
   - Projection des quantités journalières sur les 7 prochains jours.
   - Détection des ruptures sous 7 jours (`daysBeforeStockout < 7`) via une requête SQL optimisée sans problème N+1.
4. **Tableau de Bord & Visualisation (Recharts)** :
   - Graphiques de chiffre d'affaires 30 jours (AreaChart) et top des ventes en volume (BarChart).
   - Encarts dynamiques des stocks en alerte et ruptures prévues.
5. **Gestion Métier Complète** :
   - Produits (SKU unique par commerce, prix, coût d'achat, seuil d'alerte, pagination, recherche debouncée).
   - Catégories & Fournisseurs avec protection contre la suppression d'entités liées à des articles.
   - Gestion des clients avec rattachement aux factures et ventes comptoir anonymes.
   - Équipe & collaborateurs : rôles `admin` et `staff`, interdiction de s'auto-dégrader ou s'auto-supprimer.

---

## 🛠️ Stack Technique

- **Frontend** : React 18, Vite, React Router v6, Axios, Recharts, Lucide Icons.
- **Backend** : Node.js, Express.js (Architecture en couches Controller-Service-Repository).
- **Base de Données** : MySQL 8 via `mysql2/promise` (Pool de connexions, support SSL managé).
- **Validation** : Zod (validation des schémas côté client et serveur).
- **Sécurité** : Helmet, Express Rate Limit (limiteur strict sur l'authentification), JWT, Bcrypt.
- **Documentation API** : Swagger JSDoc + Swagger UI (`/api/docs`).
- **Tests & Qualité** : Jest, Supertest, ESLint, Prettier.
- **DevOps** : GitHub Actions CI/CD (Pipeline automatisé avec service MySQL 8).

---

## 📂 Architecture et Arborescence

```text
stockpro/
├── .github/
│   └── workflows/
│       └── ci.yml               # Pipeline d'intégration continue GitHub Actions
├── client/                      # Application Frontend React (Vite)
│   ├── src/
│   │   ├── components/          # Composants réutilisables (DataTable, Pagination, Modal...)
│   │   ├── context/             # Contexte d'authentification AuthContext
│   │   ├── pages/               # Pages (Dashboard, Produits, Ventes, DetailVente, Previsions...)
│   │   ├── services/            # Services Axios (products, sales, forecast, dashboard...)
│   │   └── utils/               # Formateurs de devise et de date
│   ├── vercel.json              # Configuration de réécriture SPA pour Vercel
│   └── package.json
├── server/                      # API Backend Express.js
│   ├── sql/
│   │   ├── schema.sql           # Schéma avec CREATE DATABASE (XAMPP / local)
│   │   └── schema.production.sql# Schéma sans CREATE DATABASE (MySQL Managé)
│   ├── scripts/
│   │   └── seed.js              # Seeder idempotent 60 jours d'historique
│   ├── src/
│   │   ├── config/              # Configuration env, db pool et swagger
│   │   ├── controllers/         # Contrôleurs HTTP (aucun SQL)
│   │   ├── middleware/          # Auth, rôles, validation Zod, helmet, errorHandler
│   │   ├── ml/                  # Algorithmes ML purs (linearRegression.js, forecast.js)
│   │   ├── repositories/        # Requêtes SQL paramétrées avec company_id
│   │   ├── routes/              # Définition des endpoints et documentation Swagger
│   │   └── services/            # Logique métier pure
│   ├── tests/                   # Tests Jest + Supertest (base stockpro_test isolée)
│   └── requests.http            # Fichier de requêtes HTTP REST Client
├── docs/
│   ├── DEPLOIEMENT.md           # Guide de déploiement en production sans Docker
│   └── StockPro.postman_collection.json # Collection Postman avec variables automatiques
└── README.md
```

---

## 💻 Prérequis

- **Node.js** : Version 20.x ou supérieure.
- **MySQL 8** : Via XAMPP, WampServer ou instance locale sur le port `3306`.
- **Git**.

---

## 📦 Installation Pas à Pas

### 1. Cloner le projet
```bash
git clone https://github.com/youssefbn9/projet-d-int-gration.git
cd projet-d-int-gration
```

### 2. Initialiser la Base de Données
Dans votre interface **phpMyAdmin** ou terminal MySQL :
- Importez le fichier [`server/sql/schema.sql`](server/sql/schema.sql).
- Cela créera automatiquement la base de données `stockpro` avec toutes ses tables et contraintes.

### 3. Configurer et Lancer le Serveur (Backend)
```bash
cd server
npm install

# Copier les variables d'environnement
cp .env.example .env

# Injecter les données de démonstration (60 jours de ventes réalistes)
npm run seed

# Démarrer le serveur en mode développement
npm run dev
```
Le serveur démarre sur **http://localhost:5000**.
- Swagger UI : **http://localhost:5000/api/docs**
- Healthcheck : **http://localhost:5000/api/health**

### 4. Lancer l'Application Client (Frontend)
Dans un second terminal :
```bash
cd client
npm install
npm run dev
```
L'interface s'ouvre sur **http://localhost:5173**.

---

## 👤 Comptes de Démonstration (Seed)

| Rôle | Email | Mot de passe | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrateur** | `admin@demo.tn` | `Admin123` | Accès complet (Ventes, Produits, Staff, Config, ML) |
| **Staff / Caissier** | `staff@demo.tn` | `Staff123` | Encaissement, consultation catalogue et prévisions |

---

## 📜 Scripts NPM Disponibles

### Backend (`server/`)
```bash
npm run dev          # Démarrage avec rechargement à chaud (Nodemon)
npm start            # Démarrage de production (Node.js standard)
npm test             # Tests Jest + Supertest sur base stockpro_test
npm test -- --coverage # Rapport de couverture de code
npm run seed         # Réinitialisation et peuplement 60 jours
npm run lint         # Analyse statique ESLint
npm run format       # Formatage automatique Prettier
```

### Frontend (`client/`)
```bash
npm run dev          # Serveur de développement Vite
npm run build        # Compilation de production (dossier dist/)
npm run preview      # Prévisualisation du bundle de production
npm run lint         # Analyse statique ESLint
npm run format       # Formatage automatique Prettier
```

---

## 🔐 Variables d'Environnement

### Backend (`server/.env`)
```ini
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=stockpro
DB_SSL=false
JWT_SECRET=super_secret_jwt_key_pour_stockpro_dev_256_bits
JWT_EXPIRES_IN=24h
CLIENT_URL=http://localhost:5173
```

### Frontend (`client/.env`)
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Tests & Couverture de Code

Les tests automatisés sont exécutés sur une base de données de test dédiée (`stockpro_test`) créée à la volée par le `globalSetup` de Jest, afin de **ne jamais altérer la base de données de démonstration**.

```bash
npm --prefix server test -- --coverage
```
- **Tests exécutés** : 65 tests répartis sur 8 suites de tests.
- **Taux de couverture obtenu** : **> 78 %** (Lignes et instructions).
- Couverture : Authentification, CRUD Produits, Conflits SKU, Pagination, Ventes transactionnelles, Stocks insuffisants, Annulations avec restitution, Algorithme OLS et Isolation multi-commerces.

---

## 🚢 Déploiement en Production

Pour une procédure pas à pas détaillée (Render, Railway, Vercel et MySQL managé), consultez le guide dédié :
📖 [**Consulter docs/DEPLOIEMENT.md**](docs/DEPLOIEMENT.md)

---

## 🌿 Stratégie de Branches Git

- **`main`** : Branche de production stable, protégée, reflétant le code déployé.
- **`dev`** : Branche d'intégration active regroupant les sprints validés.
- **`feature/<nom>`** : Branches éphémères pour chaque nouvelle fonctionnalité ou passe métier avant merge par Pull Request.

## Conventions de contribution

- Aucun push direct sur main : toute modification passe par une Pull Request.
- Une branche par intention : feature/..., fix/..., chore/..., docs/..., ci/...
- Commits atomiques au format conventionnel : feat:, fix:, docs:, chore:, ci:, test:
- Jamais de fichier .env dans Git : seul .env.example est versionné.
- Exemple de commit conforme : docs: documenter les conventions de contribution

## Support
Contact : equipe-a@example.invalid
