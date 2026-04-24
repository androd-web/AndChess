import { useEffect, useRef, useCallback, useState } from 'react'
import type { Difficulty, DifficultyConfig } from '../types/chess.types'
import { DIFFICULTY_CONFIG } from '../types/chess.types'

interface UseStockfishReturn {
  getBestMove:  (fen: string, difficulty: Difficulty) => void
  bestMove:     string | null
  isThinking:   boolean
  isReady:      boolean
}

export function useStockfish(): UseStockfishReturn {
  const workerRef  = useRef<Worker | null>(null)
  const [bestMove,   setBestMove]  = useState<string | null>(null)
  const [isThinking, setIsThinking] = useState(false)
  const [isReady,    setIsReady]    = useState(false)

  useEffect(() => {
    // Version single-thread plus compatible (pas de dépendance SAB/pthreads)
    const worker = new Worker('/stockfish-18-lite-single.js')
    workerRef.current = worker

    // Écoute les messages de Stockfish
    worker.onmessage = (e: MessageEvent<string>) => {
      const msg = e.data
      if (msg === 'readyok') { setIsReady(true); return }
      if (msg.startsWith('bestmove')) {
        const move = msg.split(' ')[1]  // ex: "bestmove e2e4 ponder d7d5"
        setBestMove(move)
        setIsThinking(false)
      }
    }

    // Initialise le protocole UCI
    worker.postMessage('uci')
    worker.postMessage('isready')

    return () => worker.terminate()  // Nettoyage au démontage
  }, [])

  const getBestMove = useCallback((fen: string, difficulty: Difficulty): void => {
    if (!workerRef.current || !isReady) return
    const config: DifficultyConfig = DIFFICULTY_CONFIG[difficulty]
    setIsThinking(true)
    setBestMove(null)

    // Commandes UCI envoyées au moteur
    workerRef.current.postMessage(`setoption name Skill Level value ${config.skillLevel}`)
    workerRef.current.postMessage(`position fen ${fen}`)
    workerRef.current.postMessage(`go movetime ${config.moveTime} depth ${config.depth}`)
  }, [isReady])

  return { getBestMove, bestMove, isThinking, isReady }
}