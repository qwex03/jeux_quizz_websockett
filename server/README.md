# Server — Jeux Quizz

Squelette d'un serveur Node pour le jeu de quizz.

Important: aucun code WebSocket n'est fourni ici — implémente ton serveur à partir de `index.js`.

Suggestions:
- Utiliser `ws` (WebSocket natif) ou `socket.io`.
- Exposer une API HTTP pour l'administration (CRUD des questions) et un serveur WebSocket pour les évènements temps réel.

Commandes:
- npm install
- npm run dev

Exemple d'architecture:
- `index.js` — point d'entrée
- `src/` — éventuels modules (routes, gestion des questions, utils)

Bonne implémentation !
