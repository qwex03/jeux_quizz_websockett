import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useWebSocket } from '../ws/WebSocketContext'
import { useRoomMessages } from '../hooks/useRoomMessages'
import Notif from '../components/Notif'

export default function Create() {
  const location = useLocation()
  const [name, setName] = useState('')
  const [room, setRoom] = useState(location.state?.room || null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [notif, setNotif] = useState(null)
  const navigate = useNavigate()
  const { send, addMessageListener } = useWebSocket()

  const handleMessage = useRoomMessages({
    setRoom,
    navigate,
    onRoomCreated: (data) => console.log('Room updated state:', data.room)
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

  function createRoom() {
    console.log('Sending create_room:', { type: 'create_room',
      name,
      playerName: newPlayerName
    })
    send(JSON.stringify({
      type: 'create_room',
      name,
      playerName: newPlayerName
    }))
  }

  function kickPlayer(playerId) {
    console.log(playerId)
    send(JSON.stringify({
      type: 'kick_player',
      roomId: room.id,
      playerId
    }))
  }

  function startGame() {
    send(JSON.stringify({
      type: 'start_game',
      roomId: room.id
    }))
  }

  function leavingRoom() {
    send(JSON.stringify({
      type: 'leave_room',
      roomId: room.id,
      playerName: newPlayerName
    }))
    setRoom(null)
    navigate('/')
  }

  return (
    <div className="room-page" style={{padding:20}}>
      <Notif
        text={notif}
        duration={2500}
        onClose={() => setNotif(null)}
      />
      {!room ? (
        <div className="room-create">
          <h2>Créer une partie</h2>
          <div style={{marginBottom: 12}}>
            <label style={{display: 'block', marginBottom: 4}}>Nom de la partie :</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Mon Quiz" />
          </div>
          <div style={{marginBottom: 12}}>
            <label style={{display: 'block', marginBottom: 4}}>Votre nom :</label>
            <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} placeholder="Votre nom" />
          </div>
          <div style={{marginTop:12}}>
            <button className="cta-button btn-primary" onClick={createRoom} disabled={!name || !newPlayerName}>Créer</button>
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
                  {!p.isHost && <button onClick={() =>kickPlayer(p.id)} className="small-btn">Expulser</button>}
                </li>
              ))
            ) : (
              <li>Aucun joueur pour le moment</li>
            )}
          </ul>
        </div>
        <div className='btn-game'> 
          <button className="cta-button" onClick={() => leavingRoom()} style={{marginTop: 20, marginLeft: 12}}>Quitter</button>
          <button className="cta-button btn-primary" onClick={() => startGame()} style={{marginTop: 20, marginLeft: 12}}>Lancer la partie</button>
        </div>
        </div>
      )}
    </div>
  )
}
