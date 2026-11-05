import { useState } from "react";

// Interactive multiple-choice quiz. `data` is the JSON the AI returned.
export default function Quiz({ data }) {
  const questions = data.questions;
  const [picked, setPicked] = useState({}); // { questionIndex: chosenOptionIndex }

  const answered = Object.keys(picked).length;
  const score = questions.filter((q, i) => picked[i] === q.answerIndex).length;

  return (
    <div className="output quiz">
      {questions.map((q, qi) => {
        const done = picked[qi] !== undefined;
        return (
          <div className="q" key={qi}>
            <h3>
              {qi + 1}. {q.question}
            </h3>

            {q.options.map((opt, oi) => {
              let cls = "choice";
              if (done && oi === q.answerIndex) cls += " correct";
              else if (done && oi === picked[qi]) cls += " wrong";

              return (
                <button
                  key={oi}
                  className={cls}
                  disabled={done}
                  onClick={() => setPicked({ ...picked, [qi]: oi })}
                >
                  {opt}
                </button>
              );
            })}

            {done && q.explanation && <p className="explain">{q.explanation}</p>}
          </div>
        );
      })}

      {answered === questions.length && (
        <div className="score">
          Score: {score} / {questions.length} {score === questions.length ? "🎉" : ""}
          <button className="link" onClick={() => setPicked({})}>Retake</button>
        </div>
      )}
    </div>
  );
}
