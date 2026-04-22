import { useState, useCallback } from 'react'
import { Chess } from 'chess.js'
import type { Square} from 'chess.js'
import type { GameState, MoveData } from '../types/chess.types'

// Type de retour du hook — explicite pour la clarté
interface UseChessGameReturn {
  gameState: GameState
  makeMove:  (move: MoveData) => boolean
  resetGame: () => void
  getLegalMoves: (square: Square) => Square[]
}

export function useChessGame(): UseChessGameReturn {
  const [game, setGame] = useState<Chess>(() => new Chess())

  // Tente de jouer un coup. Retourne true si légal et joué.
  const makeMove = useCallback((move: MoveData): boolean => {
    const gameCopy = new Chess(game.fen())
    try {
      const result = gameCopy.move(move)
      if (result !== null) {
        setGame(gameCopy)
        return true
      }
    } catch {
      // Coup illégal : chess.js lance une exception
    }
    return false
  }, [game])

  // Retourne les cases cibles légales depuis une case donnée
  const getLegalMoves = useCallback((square: Square): Square[] => {
    return game
      .moves({ square, verbose: true })
      .map((m) => m.to as Square)
  }, [game])

  const resetGame = (): void => setGame(new Chess())

  const gameState: GameState = {
    fen:         game.fen(),
    turn:        game.turn(),
    isCheck:     game.inCheck(),
    isCheckmate: game.isCheckmate(),
    isStalemate: game.isStalemate(),
    isDraw:      game.isDraw(),
    isGameOver:  game.isGameOver(),
    history:     game.history(),
  }

  return { gameState, makeMove, resetGame, getLegalMoves }
}