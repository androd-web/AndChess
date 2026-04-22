export function GameControls({onReset}:{onReset: () => void}) {
  return (
    <button onClick={onReset}>Nouvelle partie</button>
  )  
}