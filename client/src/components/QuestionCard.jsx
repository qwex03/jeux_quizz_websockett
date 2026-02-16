import React from "react";

function QuestionCard({
  category,
  question,
  answers,
  timeLeft,
  onAnswer,
  disabled,
  correctIndex,
  selectedIndex
}) {
  return (
    <div className="quiz-card">

      <div className="quiz-header">
        <span className="quiz-category">{category}</span>
        {timeLeft !== undefined && (
          <span className="quiz-timer">
            ⏳ {timeLeft}s
          </span>
        )}
      </div>

      <h2 className="quiz-question">{question}</h2>

      <div className="quiz-answers">
        {answers.map((answer, index) => {
          let className = "quiz-answer"

          if (correctIndex !== null) {
            if (index === correctIndex) className += " correct"
            else if (index === selectedIndex) className += " wrong"
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => onAnswer(index)}
              disabled={disabled}
            >
              {answer}
            </button>
          )
        })}
      </div>

    </div>
  );
}

export default QuestionCard;
