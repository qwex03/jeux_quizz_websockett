import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home">
      <h2>Bienvenue sur Jeux Quizz </h2>
      <p className="lead">Choisis une action pour commencer :</p>

      <div className="cta">
        <Link to="/join" className="cta-button btn-primary">Rejoindre une partie</Link>
        <Link to="/create" className="cta-button btn-secondary">Créer une partie</Link>
      </div>

    </div>
  )
} 
