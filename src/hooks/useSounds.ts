import { useState, useRef, useCallback } from "react";

interface UseSoundsReturn {
    playMove: () => void
    playIllegal: () => void
    playCheck: () => void
    isMuted: boolean
    toggleMute: () => void
}

export function useSounds(): UseSoundsReturn {

    const [isMuted, setIsMuted] = useState(false)

    const moveAudio = useRef(new Audio('/sounds/move.mp3'))
    const illegalAudio = useRef(new Audio('/sounds/illegal.mp3'))
    const checkAudio = useRef(new Audio('/sounds/check.mp3'))

    const play = useCallback((audio: HTMLAudioElement) => { 
        if (isMuted) return
        audio.currentTime = 0
        audio.play().catch(() => {})
    }, [isMuted])

    return { 
        playMove: () => play(moveAudio.current),
        playIllegal: () => play(illegalAudio.current),
        playCheck: () => play(checkAudio.current),
        isMuted,
        toggleMute: () => setIsMuted((prev) => !prev)
    }
      }