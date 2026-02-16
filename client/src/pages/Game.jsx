import React, { useEffect, useState } from 'react'
import { useWebSocket } from '../ws/WebSocketContext'
import { useNavigate } from 'react-router-dom'
import QuestionCard from '../components/QuestionCard'

export default function Game() {
  const { send, addMessageListener, isConnected } = useWebSocket()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('waiting')
  const [question, setQuestion] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [correctIndex, setCorrectIndex] = useState(null)
  const [players, setPlayers] = useState([])
  const [hasAnswered, setHasAnswered] = useState(false)
  const [isHost, setIsHost] = useState(false)

  // =========================
  // LISTEN SERVER EVENTS
  // =========================
  useEffect(() => {
    const unsubscribe = addMessageListener((data) => {

      switch (data.type) {

        case 'game_started':
          setPhase('question')
          break

        case 'new_question':
          setQuestion(data.question)
          setTimeLeft(data.timeLeft)
          setCorrectIndex(null)
          setHasAnswered(false)
          setPhase('question')
          break

        case 'timer_update':
          setTimeLeft(data.timeLeft)
          break

        case 'question_ended':
          setCorrectIndex(data.correctIndex)
          setPlayers(data.players)
          setPhase('result')
          break

        case 'game_ended':
          setPlayers(data.players)
          setPhase('finished')
          break

        case 'room_updated':
          setPlayers(data.room.players)
          break

        case 'game_state':
          setPlayers(data.players || [])
          setIsHost(!!data.isHost)

          if (data.phase === 'question') {
            setQuestion(data.question || null)
            setTimeLeft(data.timeLeft || 0)
            setCorrectIndex(null)
            setHasAnswered(false)
            setPhase('question')
            break
          }

          if (data.phase === 'result') {
            setQuestion(data.question || null)
            setCorrectIndex(data.correctIndex ?? null)
            setPhase('result')
            break
          }

          if (data.phase === 'finished') {
            setPhase('finished')
            break
          }

          setPhase('waiting')
          break

        case 'returned_to_lobby':
          navigate(data.isHost ? '/create' : '/join', { state: { room: data.room } })
          break

        default:
          break
      }
    })

    return unsubscribe
  }, [addMessageListener, navigate])

  useEffect(() => {
    if (!isConnected) return

    send(JSON.stringify({ type: 'get_game_state' }))

    if (phase !== 'waiting') return

    const intervalId = setInterval(() => {
      send(JSON.stringify({ type: 'get_game_state' }))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [isConnected, phase, send])

  // =========================
  // SEND ANSWER
  // =========================
  function handleAnswer(index) {
    if (hasAnswered || phase !== 'question') return

    send(JSON.stringify({
      type: 'answer',
      answerIndex: index
    }))

    setHasAnswered(true)
  }

  const rankedPlayers = [...players].sort((a, b) => b.score - a.score)

  // =========================
  // RENDER
  // =========================

  if (!isConnected) {
    return <h2>Connexion au serveur...</h2>
  }

  if (phase === 'waiting') {
    return <h2>En attente du lancement...</h2>
  }

  if (phase === 'question' && question) {
    return (
      <QuestionCard
        question={question.text}
        answers={question.answers}
        timeLeft={timeLeft}
        onAnswer={handleAnswer}
        disabled={hasAnswered}
      />
    )
  }

  if (phase === 'result' && question) {
    return (
      <div className="quiz-card scoreboard">
        <h2 className="result-title">Bonne réponse : {question.answers[correctIndex]}</h2>
        <h3 className="score-title">Scores :</h3>
        {rankedPlayers.map((p, index) => (
          <div className="score-item" key={p.id}>
            <span className="rank">{index + 1}</span>
            <span className='player-name'>{p.name}</span>
            <span className='score'>{p.score} pts</span>
          </div>
        ))}
      </div>
    )
  }

  if (phase === 'finished') {
    return (
      <div className='quiz-card scoreboard'>
        <h2 className='result-title'>Partie terminée 🎉</h2>
        {rankedPlayers
          .map((p, index) => (
            <div className="score-item" key={p.id}>
              <span className="rank">{index + 1}</span>
              <span className='player-name'>{p.name}</span>
              <span className='score'>{p.score} pts</span>
            </div>
        ))}
        {isHost && (
          <button
            className="cta-button btn-primary"
            style={{ marginTop: 16 }}
            onClick={() => send(JSON.stringify({ type: 'return_to_lobby' }))}
          >
            Retour au lobby
          </button>
        )}
      </div>
    )
  }

  return null
}
