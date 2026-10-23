from app.services.chunker import chunk_text


class TestChunkText:
    def test_empty_text_returns_no_chunks(self):
        assert chunk_text("") == []
        assert chunk_text("   ") == []

    def test_short_text_returns_single_chunk(self):
        text = "This is a short policy statement."
        assert chunk_text(text) == [text]

    def test_long_text_splits_into_multiple_chunks(self):
        text = "Paragraph one. " * 100
        chunks = chunk_text(text, chunk_size=200, overlap=20)
        assert len(chunks) > 1
        for chunk in chunks:
            assert len(chunk) > 0

    def test_chunks_cover_the_source_text(self):
        text = ("Sentence number %d. " % i for i in range(200))
        text = "".join(text)
        chunks = chunk_text(text, chunk_size=300, overlap=30)
        # Every chunk must be an actual substring of the original —
        # nothing invented, nothing silently dropped mid-chunk.
        for chunk in chunks:
            assert chunk in text

    def test_prefers_paragraph_boundary_over_hard_cut(self):
        text = "First paragraph with enough content to matter here.\n\n" + (
            "Second paragraph. " * 30
        )
        chunks = chunk_text(text, chunk_size=60, overlap=10)
        assert chunks[0].endswith("here.")

    def test_overlap_keeps_boundary_content_in_both_chunks(self):
        text = "Word " * 300
        chunks = chunk_text(text, chunk_size=200, overlap=50)
        assert len(chunks) > 1
        # The tail of one chunk should reappear near the head of the next.
        tail = chunks[0][-20:].strip()
        assert tail in chunks[1] or chunks[1].startswith(tail[:10])

    def test_custom_chunk_size_respected_approximately(self):
        text = "x" * 50 + " " + "y" * 5000
        chunks = chunk_text(text, chunk_size=500, overlap=0)
        assert all(len(c) <= 550 for c in chunks)  # some slack for boundary search
