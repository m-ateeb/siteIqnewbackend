export function extractHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (err) {
    return "Invalid URL";
  }
}
