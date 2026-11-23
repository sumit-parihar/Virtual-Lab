// Read-only quiz for instructors: every question with its options and the
// correct answer marked. Nothing can be selected or submitted here.
// Same look as the student quiz: lettered option cards, the correct one in green with a tick.
const LETTERS = "ABCDEFGHIJ";

export default function AnswerKey({ quiz, emptyText }) {
  if (!quiz || quiz.questions.length === 0) {
    return <p className="ic-placeholder">{emptyText}</p>;
  }

  return (
    <ol className="ic-quiz">
      {quiz.questions.map((question, qi) => (
        <li key={question.id} className="ic-quiz__question">
          <p className="ic-quiz__num">Question {qi + 1} of {quiz.questions.length}</p>
          <p className="ic-quiz__text">{question.question_text}</p>
          <ul className="ic-quiz__options">
            {question.options
              .slice()
              .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
              .map((option, oi) => (
                <li
                  key={option.id}
                  className={`ic-quiz__option${option.is_correct ? " ic-quiz__option--correct" : ""}`}
                >
                  <span className="ic-quiz__key" aria-hidden="true">{option.is_correct ? "✓" : LETTERS[oi]}</span>
                  <span className="ic-quiz__label">{option.option_text}</span>
                  {option.is_correct && <span className="badge badge--green">Correct answer</span>}
                </li>
              ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}
