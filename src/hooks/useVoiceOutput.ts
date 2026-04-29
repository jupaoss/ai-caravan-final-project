import { useCallback, useRef } from 'react'

interface UseVoiceOutputReturn {
  speak: (text: string, onBoundary?: (charIndex: number) => void, onEnd?: () => void) => void
  stop: () => void
  isSpeaking: boolean
}

export const useVoiceOutput = (): UseVoiceOutputReturn => {
  const isSpeakingRef = useRef(false)

  const speak = useCallback((
    text: string,
    onBoundary?: (charIndex: number) => void,
    onEnd?: () => void
  ) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.85
    utterance.pitch = 1

    if (onBoundary) {
      utterance.onboundary = (e) => onBoundary(e.charIndex)
    }
    utterance.onstart = () => { isSpeakingRef.current = true }
    utterance.onend = () => {
      isSpeakingRef.current = false
      onEnd?.()
    }
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    isSpeakingRef.current = false
  }, [])

  return { speak, stop, isSpeaking: isSpeakingRef.current }
}
