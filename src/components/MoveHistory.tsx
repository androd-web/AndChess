export function MoveHistory({history}: {history: string[]} ) {
    return (
        <div>
            {history.map((move,i) => (
                <div key={i}>{move}</div>
            ))}
        </div>
    )
}