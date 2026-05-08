import { Chess } from 'chess.js'
import type { Square } from 'chess.js'

export interface MoveInput {
  from:       Square
  to:         Square
  promotion?: string
}

export interface MoveResult {
  success:    boolean
  fen?:       string
  history?:   string[]
  isGameOver?: boolean
  isCheckmate?: boolean
  isStalemate?: boolean
  isDraw?:    boolean
  winner?:    'white' | 'black' | 'draw' | null
  reason?:    'checkmate' | 'stalemate' | 'draw' | 'resign'
  error?:     string
}

/**
 * Applique un coup sur une instance Chess existante.
 * Retourne le résultat avec le nouvel état FEN.
 */
export function applyMove(game: Chess, move: MoveInput): MoveResult {
  try {
    const result = game.move({
      from:      move.from,
      to:        move.to,
      promotion: move.promotion ?? 'q',
    })

    if (!result) {
      return { success: false, error: 'Coup illégal' }
    }

    const isCheckmate = game.isCheckmate()
    const isStalemate = game.isStalemate()
    const isDraw      = game.isDraw()
    const isGameOver  = game.isGameOver()

    let winner: 'white' | 'black' | 'draw' | null = null
    let reason: 'checkmate' | 'stalemate' | 'draw' | undefined

    if (isCheckmate) {
      // Le joueur qui vient de jouer a fait mat
      // game.turn() retourne maintenant le camp qui DOIT jouer (perdant)
      winner = game.turn() === 'w' ? 'black' : 'white'
      reason = 'checkmate'
    } else if (isStalemate) {
      winner = 'draw'
      reason = 'stalemate'
    } else if (isDraw) {
      winner = 'draw'
      reason = 'draw'
    }

    return {
      success:    true,
      fen:        game.fen(),
      history:    game.history(),
      isGameOver,
      isCheckmate,
      isStalemate,
      isDraw,
      winner,
      reason,
    }
  } catch {
    return { success: false, error: 'Coup illégal ou invalide' }
  }
}

/**
 * Vérifie si un coup est légal sans l'appliquer.
 */
export function isMoveLegal(fen: string, move: MoveInput): boolean {
  try {
    const game   = new Chess(fen)
    const result = game.move({ from: move.from, to: move.to, promotion: move.promotion ?? 'q' })
    return result !== null
  } catch {
    return false
  }
}

/**
 * Retourne tous les coups légaux depuis une case.
 */
export function getLegalMovesFromSquare(fen: string, square: Square): Square[] {
  try {
    const game = new Chess(fen)
    return game
      .moves({ square, verbose: true })
      .map(m => m.to as Square)
  } catch {
    return []
  }
}
