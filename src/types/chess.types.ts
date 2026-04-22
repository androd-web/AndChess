import type {Square, PieceSymbol, Color } from 'chess.js'

export interface GameState {
  fen:         string
  turn:        Color          
  isCheck:     boolean
  isCheckmate: boolean
  isStalemate: boolean
  isDraw:      boolean
  isGameOver:  boolean
  history:     string[]
}

export interface MoveData {
  from:       Square        
  to:         Square
  promotion?: PieceSymbol    
}

export type PromotionPiece = 'q' | 'r' | 'b' | 'n'

export type GameMode = 'solo' | 'multiplayer'  