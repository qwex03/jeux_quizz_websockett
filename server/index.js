const express = require('express')
const http = require('http')
const { WebSocketServer } = require('ws')

const app = express()
const server = http.createServer(app)
const wss = new WebSocketServer({ server, path: '/ws' })

app.use(express.json())
app.get('/', (req, res) => res.send('Quiz WebSocket server'))

// ===============================
// MEMORY
// ===============================

const rooms = new Map()

// ===============================
// UTILS
// ===============================

function broadcastToRoom(roomId, payload) {
  wss.clients.forEach(client => {
    if (client.readyState === 1 && client.roomId === roomId) {
      client.send(JSON.stringify(payload))
    }
  })
}

function generateRoomId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

// ===============================
// GAME LOGIC
// ===============================

function startQuestion(room) {
  const question = room.questions[room.currentQuestionIndex]

  room.phase = 'question'
  room.timeLeft = 15
  room.answersReceived = new Set()

  broadcastToRoom(room.id, {
    type: 'new_question',
    question: {
      text: question.question,
      answers: question.answers
    },
    timeLeft: room.timeLeft
  })

  room.timer = setInterval(() => {
    room.timeLeft--

    broadcastToRoom(room.id, {
      type: 'timer_update',
      timeLeft: room.timeLeft
    })

    if (room.timeLeft <= 0) {
      clearInterval(room.timer)
      endQuestion(room)
    }
  }, 1000)
}

function endQuestion(room) {
  const question = room.questions[room.currentQuestionIndex]
  room.phase = 'result'

  broadcastToRoom(room.id, {
    type: 'question_ended',
    correctIndex: question.correctIndex,
    players: room.players
  })

  setTimeout(() => {
    room.currentQuestionIndex++

    if (room.currentQuestionIndex >= room.questions.length) {
      room.phase = 'finished'
      broadcastToRoom(room.id, {
        type: 'game_ended',
        players: room.players
      })
    } else {
      startQuestion(room)
    }
  }, 3000)
}

function resetRoomGame(room) {
  clearInterval(room.timer)
  room.timer = null
  room.currentQuestionIndex = 0
  room.phase = 'lobby'
  room.players.forEach(p => p.score = 0)
}

// ===============================
// WEBSOCKET
// ===============================

wss.on('connection', (ws) => {
  console.log('[ws] client connected')

  ws.on('message', (message) => {
    let data
    try {
      data = JSON.parse(message)
    } catch {
      return
    }

    // =========================
    // CREATE ROOM
    // =========================
    if (data.type === 'create_room') {
      const roomId = generateRoomId()

      const room = {
        id: roomId,
        name: data.name,
        players: [
          {
            id: 1,
            name: data.playerName,
            isHost: true,
            score: 0
          }
        ],
        phase: 'lobby',
        questions: [
          {
            question: "Capital de la France ?",
            answers: ["Paris", "Lyon", "Marseille", "Nice"],
            correctIndex: 0
          },
          {
            question: "2 + 2 ?",
            answers: ["3", "4", "5", "22"],
            correctIndex: 1
          }
        ],
        currentQuestionIndex: 0,
        timer: null,
        timeLeft: 0,
        answersReceived: new Set()
      }

      rooms.set(roomId, room)

      ws.roomId = roomId
      ws.playerName = data.playerName

      ws.send(JSON.stringify({ type: 'room_created', room }))
    }

    // =========================
    // JOIN ROOM
    // =========================
    else if (data.type === 'join_room') {
      const room = rooms.get(data.roomId)
      if (!room || room.phase !== 'lobby') {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not available' }))
        return
      }

      const newPlayer = {
        id: Date.now(),
        name: data.playerName,
        isHost: false,
        score: 0
      }

      room.players.push(newPlayer)

      ws.roomId = room.id
      ws.playerName = data.playerName

      broadcastToRoom(room.id, { type: 'room_updated', room })
    }

    // =========================
    // START GAME (host only)
    // =========================
    else if (data.type === 'start_game') {
      const room = rooms.get(ws.roomId)
      if (!room) return

      const player = room.players.find(p => p.name === ws.playerName)
      if (!player?.isHost) return

      resetRoomGame(room)
      room.phase = 'question'

      broadcastToRoom(room.id, { type: 'game_started' })
      startQuestion(room)
    }

    // =========================
    // RETURN TO LOBBY (host only)
    // =========================
    else if (data.type === 'return_to_lobby') {
      const room = rooms.get(ws.roomId)
      if (!room) return

      const player = room.players.find(p => p.name === ws.playerName)
      if (!player?.isHost) return

      resetRoomGame(room)

      wss.clients.forEach(client => {
        if (client.readyState !== 1 || client.roomId !== room.id) return

        const clientPlayer = room.players.find(p => p.name === client.playerName)
        client.send(JSON.stringify({
          type: 'returned_to_lobby',
          room,
          isHost: !!clientPlayer?.isHost
        }))
      })
    }

    // =========================
    // ANSWER
    // =========================
    else if (data.type === 'answer') {
      const room = rooms.get(ws.roomId)
      if (!room || room.phase !== 'question') return

      if (room.answersReceived.has(ws.playerName)) return

      const question = room.questions[room.currentQuestionIndex]
      const player = room.players.find(p => p.name === ws.playerName)
      if (!player) return

      room.answersReceived.add(ws.playerName)

      if (data.answerIndex === question.correctIndex) {
        player.score += 1
      }

      if (room.answersReceived.size === room.players.length) {
        clearInterval(room.timer)
        endQuestion(room)
      }
    }

    // =========================
    // GET GAME STATE
    // =========================
    else if (data.type === 'get_game_state') {
      const room = rooms.get(ws.roomId)
      if (!room) return
      const currentPlayer = room.players.find(p => p.name === ws.playerName)

      const payload = {
        type: 'game_state',
        phase: room.phase,
        players: room.players,
        timeLeft: room.timeLeft,
        isHost: !!currentPlayer?.isHost
      }

      if (room.currentQuestionIndex < room.questions.length) {
        const currentQuestion = room.questions[room.currentQuestionIndex]
        payload.question = {
          text: currentQuestion.question,
          answers: currentQuestion.answers
        }

        if (room.phase === 'result') {
          payload.correctIndex = currentQuestion.correctIndex
        }
      }

      ws.send(JSON.stringify(payload))
    }

    // =========================
    // KICK PLAYER (host only)
    // =========================
    else if (data.type === 'kick_player') {
      const room = rooms.get(ws.roomId)
      if (!room || room.phase !== 'lobby') return

      const player = room.players.find(p => p.name === ws.playerName)
      if (!player?.isHost) return

      const kickedPlayer = room.players.find(p => p.id === data.playerId)
      if (!kickedPlayer || kickedPlayer.isHost) return

      room.players = room.players.filter(p => p.id !== data.playerId)

      wss.clients.forEach(client => {
        if (
          client.readyState === 1 &&
          client.roomId === room.id &&
          client.playerName === kickedPlayer.name
        ) {
          client.send(JSON.stringify({ type: 'kicked' }))
          delete client.roomId
          delete client.playerName
        }
      })

      broadcastToRoom(room.id, { type: 'room_updated', room })
    }

    // =========================
    // LEAVE ROOM
    // =========================
    else if (data.type === 'leave_room') {
      handleLeave(ws)
    }
  })

  ws.on('close', () => {
    handleLeave(ws)
  })
})

// ===============================
// HANDLE LEAVE
// ===============================

function handleLeave(ws) {
  const roomId = ws.roomId
  if (!roomId) return

  const room = rooms.get(roomId)
  if (!room) return

  room.players = room.players.filter(p => p.name !== ws.playerName)

  if (room.players.length === 0) {
    clearInterval(room.timer)
    rooms.delete(roomId)
    return
  }

  if (!room.players.some(p => p.isHost)) {
    room.players[0].isHost = true
  }

  broadcastToRoom(roomId, { type: 'room_updated', room })

  delete ws.roomId
  delete ws.playerName
}

// ===============================

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
