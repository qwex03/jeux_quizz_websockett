export default function Test() {
  return (
    <div className="quiz-card scoreboard">
      <h2 className="result-title">Bonne réponse : 3</h2>

      <h3 className="score-title">Classement</h3>

      <div className="score-list">
        <div className="score-item">
          <span className="rank">1</span>
          <span className="name">Quentin</span>
          <span className="points">1 pts</span>
        </div>

        <div className="score-item">
          <span className="rank">2</span>
          <span className="name">Lucas</span>
          <span className="points">0 pts</span>
        </div>
      </div>
    </div>
  )
}
