// Extracts a YouTube video ID from any common URL format (watch, live, embed,
// shortened youtu.be) so the frontend can build a clean embed + auto-detect
// live status via the YouTube oEmbed/Data API if a key is provided.
function extractYouTubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();

  // Already a bare 11-char video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const match = trimmed.match(p);
    if (match) return match[1];
  }
  return null;
}

module.exports = { extractYouTubeId };
