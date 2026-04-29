import { useState, useCallback } from 'react'

export interface KaraokeWord {
  word: string
  start: number
  end: number
  state: 'unread' | 'active' | 'read'
}

export const useKaraoke = (text: string) => {
  const buildWords = (): KaraokeWord[] => {
    const words: KaraokeWord[] = []
    let charIndex = 0
    text.split(' ').forEach((word) => {
      words.push({ word, start: charIndex, end: charIndex + word.length, state: 'unread' })
      charIndex += word.length + 1
    })
    return words
  }

  const [words, setWords] = useState<KaraokeWord[]>(buildWords)

  const updateBoundary = useCallback((charIndex: number) => {
    setWords(prev => prev.map(w => ({
      ...w,
      state: w.end <= charIndex ? 'read' : w.start <= charIndex ? 'active' : 'unread'
    })))
  }, [])

  const reset = useCallback(() => setWords(buildWords()), [text])

  return { words, updateBoundary, reset }
}
