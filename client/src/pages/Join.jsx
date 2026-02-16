import React, { useState, useEffect } from 'react'
import { useWebSocket } from '../ws/WebSocketContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { useRoomMessages } from '../hooks/useRoomMessages'

export default function Join() {
  const location = useLocation()
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [room, setRoom] = useState(location.state?.room || null);
  const { send, addMessageListener } = useWebSocket();
  const navigate = useNavigate();

  const handleMessage = useRoomMessages({
  setRoom,
  navigate,
  onKicked: () => {
    alert('Vous avez été expulsé de la partie.')
    setRoom(null)
    navigate('/')
  }
})

useEffect(() => {
  const unsubscribe = addMessageListener(handleMessage)
  return unsubscribe
}, [addMessageListener, handleMessage])

useEffect(() => {
  if (location.state?.room) {
    setRoom(location.state.room)
  }
}, [location.state])

  function joinRoom() {
    console.log('Joining room:', roomCode, playerName)
    send(JSON.stringify({
      type: 'join_room',
      roomId: roomCode,
      playerName
    }))
  }

  function leavingRoom() {
    send(JSON.stringify({
      type: 'leave_room',
      roomId: room.id,
      playerName
    }))
    setRoom(null)
    navigate('/')
  }

  return (
    <div className="room-page" style={{padding:20}}>
      {!room ? (
        <div>
          <h2>Rejoindre une partie</h2>
          <div style={{marginBottom: 12}}>
            <label style={{display: 'block', marginBottom: 4}}>Code de la partie :</label>
            <input value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Entrez le code" />
          </div>
          <div style={{marginBottom: 12}}>
            <label style={{display: 'block', marginBottom: 4}}>Votre nom :</label>
            <input value={playerName} onChange={e => setPlayerName(e.target.value)} placeholder="Votre nom" />
          </div>
          <div style={{marginTop:12}}>
            <button className="cta-button btn-primary" onClick={joinRoom} disabled={!roomCode || !playerName}>Rejoindre</button>
          </div>
        </div>
      ) : (
        <div className="room-card">
          <h2>Partie {room.name}</h2>
          <div className="room-header">
            <div className="room-code">{room.id}</div>
          <div>
              <button  className="cta-button" style={{width: 'auto', padding: '8px 12px'}}>Copier le lien</button>
            </div>
          </div>

          <p className="muted">Partager ce code ou le lien ci-dessus pour que les joueurs rejoignent.</p>

          <div className="players">
          <div className="players-header">
            <strong>Joueurs ({room?.players?.length ?? 0})</strong>
          </div>
          <ul className="players-list">
            {room?.players?.length > 0 ? (
              room.players.map(p => (
                <li key={p.id} className="player-item">
                  <span className="player-name">{p.name}{p.isHost ? ' (hôte)' : ''}</span>
                </li>
              ))
            ) : (
              <li>Aucun joueur pour le moment</li>
            )}
          </ul>
          </div>
          <div className='btn-game'>
            <button className="cta-button" onClick={() => leavingRoom()} style={{marginTop: 20}}>Quitter</button>
          </div>
        </div>
      )}
      
    </div>
  )
}
