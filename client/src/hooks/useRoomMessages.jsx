import { useCallback } from 'react'

export function useRoomMessages({ setRoom, navigate, onKicked, onRoomCreated }) {
  return useCallback((data) => {
    if (!data) return

    if (data.type === 'room_created') {
      setRoom(data.room)
      onRoomCreated?.(data)
      return
    }

    if (data.type === 'room_joined' || data.type === 'room_updated') {
      setRoom(data.room)
      return
    }

    if (data.type === 'leave_room') {
      setRoom(null)
      navigate('/')
      return
    }

    if (data.type === 'game_started') {
      navigate('/game')
      return
    }

    if (data.type === 'kicked') {
      onKicked?.(data)
      return
    }
  }, [setRoom, navigate, onKicked, onRoomCreated])
}
