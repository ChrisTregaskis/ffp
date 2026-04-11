/**
 * Parse simple markdown formatting in exercise notes.
 *
 * Supports:
 * - **bold text** → <strong>bold text</strong>
 * - Line breaks (newlines) → <br />
 *
 * Returns an array of React-safe segments for rendering.
 *
 * ! **Full markdown not supported.**
 */
export const parseExerciseNotes = (notes: string): React.ReactNode[] => {
  const lines = notes.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      elements.push(<br key={`br-${String(lineIndex)}`} />);
    }

    // Parse **bold** markers within the line
    const parts = line.split(/(\*\*.*?\*\*)/g);

    parts.forEach((part, partIndex) => {
      const key = `${String(lineIndex)}-${String(partIndex)}`;

      if (part.startsWith('**') && part.endsWith('**')) {
        elements.push(<strong key={key}>{part.slice(2, -2)}</strong>);
      } else {
        elements.push(<span key={key}>{part}</span>);
      }
    });
  });

  return elements;
};
