/**
 * TruncatedText — Renders text trimmed to `maxLength` characters with "…".
 *
 * Optionally shows the full text in a native tooltip on hover.
 */

export interface TruncatedTextProps {
  /** The full text to display. */
  text: string;
  /** Max visible characters before truncation. Defaults to 80. */
  maxLength?: number;
  /** Extra class names on the wrapper span. */
  className?: string;
}

export function TruncatedText({ text, maxLength = 80, className = "" }: TruncatedTextProps) {
  if (!text) return <span className={className}>—</span>;

  const needsTruncation = text.length > maxLength;

  return (
    <span className={className} title={needsTruncation ? text : undefined}>
      {needsTruncation ? `${text.slice(0, maxLength)}…` : text}
    </span>
  );
}
