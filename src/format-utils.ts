/**
 * Maps HTTP content type to N3 writer format
 * @param contentType HTTP content type
 * @returns N3 format string
 */
export function mapContentTypeToFormat(
  contentType?: string,
): string | undefined {
  if (!contentType) return undefined; // Default to Turtle

  // Convert to lowercase for case-insensitive comparison
  const type = contentType.toLowerCase();

  switch (true) {
    case type.includes("application/n-triples"):
      return "N-Triples";
    case type.includes("application/n-quads"):
      return "N-Quads";
    case type.includes("application/trig"):
      return "TriG";
    case type.includes("text/n3"):
      return "N3";
    case type.includes("application/rdf+xml"):
      return "RDF/XML"; // Note: N3.js might not directly support this
    case type.includes("application/json"):
    case type.includes("application/ld+json"):
      return "application/ld+json"; // JSON-LD format
    default:
      return "Turtle"; // Default to Turtle for text/turtle and other types
  }
}

/**
 * Parses Accept header and returns media types sorted by quality value
 */
export function parseAcceptHeader(acceptHeader: string): string[] {
  const mediaTypeEntries = acceptHeader.split(",")
    .map((entry) => {
      const [mediaType, ...params] = entry.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const quality = qParam ? parseFloat(qParam.split("=")[1]) : 1.0;

      return { mediaType: mediaType.trim(), quality };
    })
    .filter((entry) => !isNaN(entry.quality) && entry.quality > 0);

  mediaTypeEntries.sort((a, b) => b.quality - a.quality);
  return mediaTypeEntries.map((entry) => entry.mediaType);
}
