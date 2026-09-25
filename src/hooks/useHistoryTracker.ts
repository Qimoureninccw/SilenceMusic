// src/hooks/useHistoryTracker.ts
import { useEffect } from 'react'
import { usePlayerStore } from '../store/playerStore'
import { useUserStore } from '../store/userStore'

export function useHistoryTracker() {
  const currentIndex = usePlayerStore(s => s.currentIndex)
  const queue = usePlayerStore(s => s.queue)
  const addHistory = useUserStore(s => s.addHistory)

  useEffect(() => {
    const song = currentIndex >= 0 ? queue[currentIndex] : null
    if (song) addHistory(song)
  }, [currentIndex, queue, addHistory])
}