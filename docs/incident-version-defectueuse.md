# Compte rendu d'incident : mise en service de v0.9.0 et retour arrière

Ce qui s'est passé : la version v0.9.0, dont l'image de l'API démarre sur un fichier inexistant, a été mise en service en staging à 23:34:02 ; le conteneur de l'API s'arrêtait aussitôt après chaque démarrage (14 redémarrages observés, code de sortie 1).
Détection : par l'échec du contrôle de santé (scripts/wait-healthy.sh : 12 tentatives, puis code de sortie 1) ; première erreur utile des journaux : « Error: Cannot find module '/app/src/inexistant.js' » (code MODULE_NOT_FOUND). La commande effective du conteneur était [node src/inexistant.js] au lieu de [npm start].
Action : retour à la version saine en remettant IMAGE_TAG=v1.0.0 et en relançant docker compose up -d --no-build, sans reconstruire d'image ; santé confirmée (code de sortie 0, réponse de santé avec uptime de quelques secondes).
Indisponibilité : environ 338 secondes entre la mise en service défectueuse et le retour à la normale, dont 8 secondes pour le retour arrière lui-même.
Prévention : ajouter dans la CI un test de démarrage du conteneur, ne garder en service qu'une version dont le contrôle de santé passe, et conserver la version précédente taguée et disponible pour le retour arrière.
