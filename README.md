# Jeux Quizz (squelette)

Ce dépôt contient un squelette pour une application de quiz temps réel.

Structure:
- `client/` — application React (interface de jeu + admin). Aucune logique WebSocket incluse.
- `server/` — squelette Node.js pour le serveur (aucune implémentation WebSocket fournie).

Notes importantes:
- Tu as demandé que je n'écrive pas la logique WebSocket: elle n'est donc pas implémentée dans `client` ni dans `server`.
- Pour démarrer le client:
  - cd client && npm install && npm run dev
- Pour démarrer le serveur (après implémentation):
  - cd server && npm install && npm run dev

Si tu veux, je peux:
- Ajouter des scripts prêts à l'emploi (lint, test)
- Préparer des routes HTTP vides pour l'administration (sans logique)
- Créer des helpers (types, format d'événements) sans implémentation côté socket

Dis-moi ce que tu veux que je fasse ensuite (je ne coderai pas la logique WebSocket).