_CHUNK_SIZE = 800
_CHUNK_OVERLAP = 100


# Simple recursive-ish splitting: prefer breaking on paragraph boundaries,
# then sentence boundaries, only falling back to a hard character cut when
# neither exists within the window — good enough for policy/FAQ-style
# knowledge text without pulling in a full NLP tokenizer dependency for
# this. Overlap keeps a sentence that straddles a chunk boundary readable
# in at least one of the two chunks it lands in.
def chunk_text(
    text: str, chunk_size: int = _CHUNK_SIZE, overlap: int = _CHUNK_OVERLAP
) -> list[str]:
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    chunks: list[str] = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = min(start + chunk_size, text_length)
        if end < text_length:
            end = _find_break_point(text, start, end)

        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break
        start = max(end - overlap, start + 1)

    return chunks


def _find_break_point(text: str, start: int, end: int) -> int:
    window = text[start:end]
    # A boundary must fall past the first quarter of the window, or it'd
    # produce a near-empty chunk on this pass instead of meaningfully
    # splitting — better to fall back to a hard cut at `end` than that.
    min_offset = (end - start) // 4
    for boundary in ("\n\n", ". ", "\n"):
        pos = window.rfind(boundary)
        if pos > min_offset:
            return start + pos + len(boundary)
    return end
