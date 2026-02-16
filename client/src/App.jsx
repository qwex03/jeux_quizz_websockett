import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { WebSocketProvider } from './ws/WebSocketContext'
import Home from './pages/Home'
import Create from './pages/Create'
import Join from './pages/Join'
import Game from './pages/Game'
import Stat from './pages/Stat'
import Test from './pages/Test'
import './styles.css'

export default function App() {
  return (
    <WebSocketProvider>
      <BrowserRouter>
        <div className="app">
          <header>
            <nav style={{display: 'flex', gap: 12}}>
              <Link to="/">Accueil</Link>
              <Link to="/stats">Stats</Link>
          </nav>
        </header>

        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<Create />} />
            <Route path="/join" element={<Join />} />
            <Route path="/game" element={<Game />} />
            <Route path="/test" element={<Test />} />
            <Route path="/stats" element={<Stat />} />
          </Routes>
        </main>
      </div>
      </BrowserRouter>
    </WebSocketProvider>
  )
}
