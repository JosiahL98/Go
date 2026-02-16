export default function RulesPage() {
  return (
    <div className="rules-page">
      <h2>How to Play Go</h2>

      <section className="rules-section">
        <h3>Overview</h3>
        <p>
          Go is a strategic board game for two players. Black and White take turns
          placing stones on the intersections of a grid. The goal is to surround
          more territory than your opponent.
        </p>
      </section>

      <section className="rules-section">
        <h3>Basic Rules</h3>
        <ol>
          <li>
            <strong>Turns:</strong> Black plays first. Players alternate placing
            one stone per turn on any empty intersection.
          </li>
          <li>
            <strong>Liberties:</strong> Every stone or connected group of stones
            must have at least one empty adjacent intersection (a "liberty") to
            remain on the board.
          </li>
          <li>
            <strong>Capture:</strong> If you fill the last liberty of an opponent's
            group, those stones are removed from the board.
          </li>
          <li>
            <strong>No Suicide:</strong> You cannot place a stone that would have
            zero liberties unless it captures opponent stones first.
          </li>
          <li>
            <strong>Ko Rule:</strong> You cannot make a move that returns the board
            to the exact same position as the previous turn. This prevents infinite
            loops of capturing and recapturing.
          </li>
        </ol>
      </section>

      <section className="rules-section">
        <h3>Ending the Game</h3>
        <ul>
          <li>
            <strong>Pass:</strong> If you have no useful moves, you may pass your
            turn. When both players pass consecutively, the game ends and scoring
            begins.
          </li>
          <li>
            <strong>Resign:</strong> You may resign at any time, conceding the game
            to your opponent.
          </li>
        </ul>
      </section>

      <section className="rules-section">
        <h3>Scoring (Chinese Rules)</h3>
        <p>This app uses <strong>area scoring</strong> (Chinese rules):</p>
        <ul>
          <li>Your score = your stones on the board + empty points you surround.</li>
          <li>
            White receives <strong>6.5 komi</strong> (bonus points) to compensate
            for Black going first.
          </li>
          <li>The player with the higher total score wins.</li>
        </ul>
      </section>

      <section className="rules-section">
        <h3>Board Sizes</h3>
        <div className="board-sizes">
          <div className="board-size-card">
            <strong>9x9</strong>
            <p>Quick games, great for beginners. Typically 15-30 minutes.</p>
          </div>
          <div className="board-size-card">
            <strong>13x13</strong>
            <p>Medium games with more strategic depth. Typically 30-60 minutes.</p>
          </div>
          <div className="board-size-card">
            <strong>19x19</strong>
            <p>Full-size board used in professional play. Can last 1-3 hours.</p>
          </div>
        </div>
      </section>

      <section className="rules-section">
        <h3>Tips for Beginners</h3>
        <ul>
          <li>Start with 9x9 to learn the basics before moving to larger boards.</li>
          <li>Focus on surrounding territory, not just capturing stones.</li>
          <li>Keep your groups connected — isolated stones are easier to capture.</li>
          <li>Don't be afraid to pass or sacrifice small groups to gain elsewhere.</li>
        </ul>
      </section>
    </div>
  );
}
