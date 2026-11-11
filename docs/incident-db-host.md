# Compte rendu d'incident : API injoignable (DB_HOST=localhost)

Ce qui s'est passé : DB_HOST a été remplacé par localhost dans compose.yaml puis le service api a été recréé ; l'API ne pouvait plus joindre MySQL.
Détection : à 01:06:21, par l'état du service api (docker compose ps) puis par les journaux. Première erreur utile : « Échec de la connexion à la base de données : » (message sans détail, l'API s'arrête au démarrage).
Cause : dans le conteneur api, localhost désigne le conteneur api lui-même et non le service db ; la configuration effective montrait DB_HOST=localhost, alors que db se résout vers une adresse privée du réseau Compose.
Correction : retour à DB_HOST=db et recréation du seul service api ; le service a été indisponible environ 184 secondes, santé confirmée par /api/health (HTTP 200).
Prévention : docker compose config avant chaque lancement, relecture du git diff de compose.yaml, passage par une Pull Request relue et contrôle de santé après toute mise en service.
