interface TypingIndicatorProps {
  usernames: string[];
}

export function TypingIndicator({ usernames }: TypingIndicatorProps) {
  if (usernames.length === 0) return null;

  let text: string;
  if (usernames.length === 1) {
    text = `${usernames[0]} is typing…`;
  } else if (usernames.length === 2) {
    text = `${usernames[0]} and ${usernames[1]} are typing…`;
  } else {
    text = 'Several people are typing…';
  }

  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span />
        <span />
        <span />
      </span>
      <span className="typing-text">{text}</span>
    </div>
  );
}
