import type { FC } from 'react'
import type { Difficulty } from '../types/chess.types'
import type { BoardTheme } from "../theme/boardTheme";

interface DifficultySelectorProps {
  value:    Difficulty
  onChange: (d: Difficulty) => void
  disabled: boolean
  theme:    BoardTheme
}

const levels: { value: Difficulty; label: string; icon: string }[] = [
  { value: 'easy',   label: 'Facile',   icon: '🟢' },
  { value: 'medium', label: 'Moyen',    icon: '🟡' },
  { value: 'hard',   label: 'Difficile', icon: '🔴' },
]

export const DifficultySelector: FC<DifficultySelectorProps> = ({
  value, onChange, disabled, theme: t
}) => (
  <div style={{ display: 'flex', gap: '6px' }}>
    {levels.map((lvl) => (
      <button
        key={lvl.value}
        onClick={() => !disabled && onChange(lvl.value)}
        disabled={disabled}
        style={{
          padding: '8px 14px',
          borderRadius: '6px',
          border: value === lvl.value
            ? `1px solid ${t.accent}`
            : `1px solid ${t.border}`,
          background: value === lvl.value
            ? `rgba(226,185,111,0.15)`
            : t.surface,
          color: value === lvl.value ? t.accent : t.muted,
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '12px', fontWeight: 600,
          gap: '6px', display: 'flex', alignItems: 'center',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        {lvl.icon} {lvl.label}
      </button>
    ))}
  </div>
)