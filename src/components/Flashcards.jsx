import { useState } from "react";

// Flip-card flashcards. `data.cards` is [{ front, back }].
export default function Flashcards({ data }) {
  const [deck, setDeck] = useState(data.cards);
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const card = deck[i];

  const go = (n) => {
    setFlip(false);
    setI((i + n + deck.length) % deck.length);
  };
  const shuffle = () => {
    setDeck([...deck].sort(() => Math.random() - 0.5));
    setI(0);
    setFlip(false);
  };

  return (
    <div className="fc">
      <div className="fc-count">
        Card {i + 1} / {deck.length}
      </div>
      <div className={"fc-card" + (flip ? " flipped" : "")} onClick={() => setFlip(!flip)}>
        <div className="fc-face fc-front">{card.front}</div>
        <div className="fc-face fc-back">{card.back}</div>
      </div>
      <div className="fc-actions">
        <button className="link" onClick={() => go(-1)}>← Prev</button>
        <button className="link" onClick={shuffle}>Shuffle 🔀</button>
        <button className="link" onClick={() => go(1)}>Next →</button>
      </div>
      <p className="fc-hint">Click the card to flip it</p>
    </div>
  );
}
