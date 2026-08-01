import React from 'react';

/**
 * Parses text containing inline markdown like **bold text**, *mismatched stars**, etc.
 * and renders clean standard JSX with <strong> tags.
 */
export function renderFormattedText(text) {
  if (!text) return null;
  if (typeof text !== 'string') return text;

  // 1. Strip leading list bullet markers (e.g. "- ", "* ", "• ")
  let cleanText = text.replace(/^\s*[\-\•]\s*/, '').replace(/^\s*\*\s+/, '');

  // 2. Fix malformed single star start before double star end: e.g. "*Header:**" -> "**Header:**"
  cleanText = cleanText.replace(/^\s*\*([^\*]+)\*\*/g, '**$1**');
  cleanText = cleanText.replace(/\*([^\*]+)\*\*/g, '**$1**');

  // 3. Split by markdown bold syntax **...**
  const parts = cleanText.split(/(\*\*.*?\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function FormattedText({ text, className, style }) {
  if (!text) return null;

  return (
    <span className={className} style={style}>
      {renderFormattedText(text)}
    </span>
  );
}
