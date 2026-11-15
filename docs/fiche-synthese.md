# Fiche de synthèse : StockPro, chaîne DevOps

## Architecture

    navigateur --> web (nginx non-root, port 5173)
                     |
                     v
                   api (Express, port 5000, non-root, HEALTHCHECK)
                     |   réseau privé Compose, DB_HOST=db
                     v
                   db (MySQL 8, port NON publié, healthcheck)
                     |
                     v
                   volume nommé mysql_data (survit à docker compose down)

L'API démarre seulement quand db est sain (depends_on avec service_healthy), et le frontend quand l'API est saine.

## Chaîne

Git (branches, Pull Requests, main protégé par ruleset avec 5 checks obligatoires) puis CI GitHub Actions (check-project, tests Node 20 et 22 avec rapport XML, frontend, docker-build avec needs) puis tag vX.Y.Z qui publie les images sur ghcr.io puis mise en service en staging avec contrôle de santé.

## Version mise en service

v1.0.0 : tag Git annoté et images ghcr.io/youssefbn9/stockpro-api:v1.0.0 et stockpro-web:v1.0.0, construites une seule fois par le pipeline et jamais reconstruites ensuite. Un tag publié ne bouge pas : une correction donne une nouvelle version.

## Retour arrière

1. Constater : ./scripts/wait-healthy.sh renvoie le code 1.
2. Lire la première erreur utile : docker compose --env-file .env.staging --env-file .env.deploy -f compose.staging.yaml logs --tail=30 api
3. Remettre IMAGE_TAG=v1.0.0 dans .env.deploy.
4. Relancer sans reconstruire : docker compose --env-file .env.staging --env-file .env.deploy -f compose.staging.yaml up -d --no-build
5. Valider : ./scripts/wait-healthy.sh renvoie le code 0.

Incident réel : la version v0.9.0 (commande de démarrage sur un fichier inexistant) a été mise en service, le contrôle de santé a échoué, puis le retour à v1.0.0 a pris 8 secondes (338 secondes d'indisponibilité au total). Détail dans docs/incident-version-defectueuse.md.

## Bonus réalisés

- Protection de main : une Pull Request dont la CI est rouge ne peut pas être fusionnée.
- Matrice de versions : tests sur Node 20 et Node 22.
- Profil debug de Compose : adminer démarré uniquement à la demande.
- Comptes rendus d'incident : docs/incident-db-host.md et docs/incident-version-defectueuse.md.
