import type {Square, PieceSymbol, Color } from 'chess.js'
export type Difficulty = 'easy' | 'medium' | 'hard'


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

export interface DifficultyConfig {
  label:      string
  skillLevel: number   // 0-20 — paramètre Stockfish
  moveTime:   number   // ms — temps de réflexion
  depth:      number   // profondeur de calcul
}

// Config par niveau
export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy:   { label: 'Facile',   skillLevel: 2,  moveTime: 500,  depth: 5  },
  medium: { label: 'Moyen',    skillLevel: 10, moveTime: 1000, depth: 10 },
  hard:   { label: 'Difficile', skillLevel: 20, moveTime: 2000, depth: 18 },
}