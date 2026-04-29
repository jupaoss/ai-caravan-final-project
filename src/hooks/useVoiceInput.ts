import { useState, useCallback, useRef } from 'react'

type VoiceState = 'idle' | 'listening' | 'processing'

interface UseVoiceInputReturn {
  state: VoiceState
  transcript: string
  startListening: () => void
  stopListening: () => void
  isSupported: boolean
}

export const useVoiceInput = (onResult: (transcript: string) => void): UseVoiceInputReturn => {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window

  const startListening = useCallback(() => {
    if (!isSupported) return
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setState('listening')
    recognition.onresult = (e: any) => {
      const result = e.results[0][0].transcript
      setTranscript(result)
      setState('processing')
      onResult(result)
    }
    recognition.onerror = () => setState('idle')
    recognition.onend = () => {
      if (state === 'listening') setState('idle')
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported, onResult, state])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setState('idle')
  }, [])

  return { state, transcript, startListening, stopListening, isSupported }
}
