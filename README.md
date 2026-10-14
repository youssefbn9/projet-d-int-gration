# StockPro

> SaaS multi-commerces de gestion de stock et de ventes — projet d'intégration.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite, React Router v6, Axios, Recharts |
| Backend | Node.js + Express.js (CommonJS) |
| BDD | MySQL 8 via XAMPP |
| Auth | JWT (jsonwebtoken) + bcrypt (10 rounds) |
| Validation | Zod |
| Docs API | Swagger UI (`/api-docs`) |
| Tests | Jest + Supertest |
| Qualité | ESLint + Prettier |

## Prérequis

- Node.js 20+
- XAMPP avec MySQL 8 démarré sur `localhost:3306`
- phpMyAdmin accessible

## Installation

### 1. Base de données

```bash
# Dans phpMyAdmin, importer :
server/sql/schema.sql
```

### 2. Backend

```bash
cd server
npm install

# Copier et configurer l'environnement
cp .env.example .env
# (les valeurs par défaut fonctionnent avec XAMPP)

# Injecter les données de démonstration
npm run seed

# Démarrer en développement
npm run dev
```

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

L'application est disponible sur **http://localhost:5173**.

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin (Boutique Alpha) | admin@alpha.com | Admin1234! |
| Staff (Boutique Alpha) | staff@alpha.com | Staff1234! |
| Admin (Épicerie Beta)  | admin@beta.com  | Admin1234! |

## Architecture backend

```
routes → middleware (auth · rôle · Zod) → controller → service → repository
```

- **Routes** : définissent les endpoints et appliquent les middlewares
- **Controllers** : orchestrent la réponse HTTP, aucun SQL
- **Services** : logique métier pure, aucun SQL direct
- **Repositories** : toutes les requêtes SQL paramétrées, filtrage `company_id`

## Fonctionnalités

- 🔐 Authentification JWT, isolation multi-commerces par `company_id`
- 📦 Catalogue produits (CRUD, filtres, alertes stock faible)
- 🛒 Ventes atomiques (transaction SQL, `SELECT FOR UPDATE`, rollback si stock insuffisant)
- 🔄 Mouvements de stock manuels (entrée / sortie / ajustement)
- 🏷️ Catégories et 🏭 Fournisseurs
- 👥 Gestion des utilisateurs (admin uniquement)
- 📊 Dashboard : graphiques CA 30 jours + top produits (Recharts)
- 📚 Documentation Swagger sur `/api-docs`

## Scripts

```bash
# Backend
npm run dev          # Démarrage nodemon
npm test             # Jest + Supertest
npm run lint         # ESLint
npm run lint:fix     # ESLint autofix
npm run format       # Prettier

# Frontend
npm run dev          # Vite dev server
npm run build        # Build production
npm run lint         # ESLint
```

## Variables d'environnement

Voir [`server/.env.example`](server/.env.example).

> ⚠️ Le fichier `.env` n'est **jamais** commité (`.gitignore`).
