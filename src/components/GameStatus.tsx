import type { FC } from 'react'
import type { GameState } from '../types/chess.types'

interface GameStatusProps {
  gameState: GameState
}

export const GameStatus: FC<GameStatusProps> = ({ gameState }) => {
  const { turn, isCheck, isCheckmate, isStalemate, isDraw } = gameState

  const getStatusMessage = (): string => {
    if (isCheckmate) return `Échec et mat ! ${turn === 'w' ? 'Noirs' : 'Blancs'} gagnent`
    if (isStalemate) return 'Pat — Partie nulle'
    if (isDraw)      return 'Partie nulle'
    if (isCheck)     return `Échec ! Tour des ${turn === 'w' ? 'Blancs' : 'Noirs'}`
    return `Tour des ${turn === 'w' ? 'Blancs' : 'Noirs'}`
  }

  return <div>{getStatusMessage()}</div>
}