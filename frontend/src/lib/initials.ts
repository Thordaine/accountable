/** The first letters of a name's first and last words, in capitals; one word, or an email, gives one. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/);
  const ends = words.length > 1 ? [words[0], words.at(-1)!] : words;
  return ends
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}
