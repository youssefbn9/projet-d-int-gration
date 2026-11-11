# Compte rendu d'incident : mise en service de v0.9.0 et retour arrière

Ce qui s'est passé : la version v0.9.0, dont l'image de l'API démarre sur un fichier inexistant, a été mise en service en staging ; l'API s'arrêtait aussitôt après chaque démarrage.
Détection : à 23:20:09, par l'échec du contrôle de santé (scripts/wait-healthy.sh, code 1 après 12 tentatives) ; première erreur utile des journaux : « Error: Cannot find module '/app/src/inexistant.js' ».
Action : retour à la version saine en remettant IMAGE_TAG=v1.0.0 et en relançant docker compose up -d --no-build, sans reconstruire d'image ; santé confirmée (code 0, HTTP 200).
Indisponibilité : environ 71 secondes entre la mise en service défectueuse et le retour à la normale, dont 2 secondes pour le retour arrière lui-même.
Prévention : ajouter dans la CI un test de démarrage du conteneur, ne garder en service qu'une version dont le contrôle de santé passe, et conserver la version précédente taguée et disponible pour le retour arrière.
