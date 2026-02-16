const BLACK = 1;
const WHITE = 2;

export default function GameInfo({
  currentPlayer, capturedByBlack, capturedByWhite,
  myColor, onPass, onResign, isOver, result,
  blackPlayer, whitePlayer, blackScore, whiteScore,
}) {
  const myTurn = currentPlayer === myColor;
  const turnLabel = currentPlayer === BLACK ? 'Black' : 'White';

  return (
    <div className="game-info">
      <div className="players">
        <div className={`player ${currentPlayer === BLACK ? 'active' : ''}`}>
          <span className="stone-icon black-stone"></span>
          <span>{blackPlayer?.username || 'Black'}</span>
          <span className="captures">Captures: {capturedByBlack}</span>
        </div>
        <div className={`player ${currentPlayer === WHITE ? 'active' : ''}`}>
          <span className="stone-icon white-stone"></span>
          <span>{whitePlayer?.username || 'White'}</span>
          <span className="captures">Captures: {capturedByWhite}</span>
        </div>
      </div>

      {isOver ? (
        <div className="game-result">
          <h3>Game Over</h3>
          <p>{result}</p>
          {blackScore != null && (
            <p>Black: {blackScore} | White: {whiteScore}</p>
          )}
        </div>
      ) : (
        <>
          <p className="turn-indicator">
            {myColor ? (myTurn ? 'Your turn' : "Opponent's turn") : `${turnLabel}'s turn`}
          </p>
          {myColor && (
            <div className="game-actions">
              <button className="btn" onClick={onPass} disabled={!myTurn}>Pass</button>
              <button className="btn btn-danger" onClick={onResign}>Resign</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
