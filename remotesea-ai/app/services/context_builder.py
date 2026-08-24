import json
from dataclasses import dataclass

from app.schemas.orchestrator import OrchestratorContext
from app.services.rag_retrieval_service import RetrievedChunk

# Hard caps, not aspirations — the doc's own rule is "không đưa toàn bộ
# knowledge base vào prompt, chỉ retrieve context liên quan", enforced here
# by actually truncating rather than just calling retrieve() with a small
# top_k and hoping. Live data is capped tighter than knowledge — it's
# already scoped to one application by the caller, so there's less reason
# for it to be large, and a runaway CvAnalysis.summary or resume-derived
# field shouldn't be able to crowd out the knowledge section.
_MAX_LIVE_DATA_CHARS = 1500
_MAX_KNOWLEDGE_CHARS = 3000
# Small on purpose — this is short-term conversational memory (does the
# follow-up question make sense given what was just asked), not a transcript
# the model needs to reason deeply over. Chat's own history-loading caps how
# many turns even reach here (see chat_service.py), this caps their total
# size too.
_MAX_HISTORY_CHARS = 1500


@dataclass
class HistoryTurn:
    question: str
    answer: str

ASK_SYSTEM_PROMPT = (
    "You are RemoteSea's internal recruiting assistant. Answer only from the "
    "AUTHORIZED LIVE DATA and REMOTESEA KNOWLEDGE sections below — never "
    "invent application details, policies, or numbers that aren't stated "
    "there. If the answer isn't in either section, say so plainly rather "
    "than guessing. Business decisions (application status, final hiring "
    "calls) belong to RemoteSea's own workflow and the humans running it, "
    "not to you — describe what the data shows, don't make the decision "
    "for them. Keep answers concise and specific to what was asked. "
    "Respond with ONLY a single JSON object, no prose outside it, matching "
    'exactly: {"answer": "your answer as a plain string", "confidence": '
    "number 0-1 reflecting how directly the provided data/knowledge "
    'supported the answer}.'
)


def _truncate(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rstrip() + " …[truncated]"


# A plain string, not a chat-message list — inference_service.py's
# OllamaProvider.complete(system, prompt) already separates the fixed
# system role from the per-request prompt; this only has to build the
# `prompt` half. Structure matches the architecture doc's own worked
# example section-for-section (SYSTEM POLICY / CURRENT USER / AUTHORIZED
# LIVE DATA / REMOTESEA KNOWLEDGE / USER QUESTION).
def build_context(
    context: OrchestratorContext,
    question: str,
    application_data: dict | None,
    rag_chunks: list[RetrievedChunk],
    history: list[HistoryTurn] | None = None,
) -> str:
    sections = [
        "CURRENT USER",
        f"Role: {context.role}"
        + (f", Company: {context.employer_id} ({context.company_role})" if context.employer_id else ""),
    ]

    if history:
        history_parts = []
        remaining = _MAX_HISTORY_CHARS
        for turn in history:
            if remaining <= 0:
                break
            entry = _truncate(f"Q: {turn.question}\nA: {turn.answer}", remaining)
            history_parts.append(entry)
            remaining -= len(entry)
        sections += ["", "CONVERSATION HISTORY", "\n\n".join(history_parts)]

    if application_data is not None:
        live_data_text = _truncate(json.dumps(application_data, ensure_ascii=False), _MAX_LIVE_DATA_CHARS)
        sections += ["", "AUTHORIZED LIVE DATA", live_data_text]

    if rag_chunks:
        knowledge_parts = []
        remaining = _MAX_KNOWLEDGE_CHARS
        for chunk in rag_chunks:
            if remaining <= 0:
                break
            entry = f"[{chunk.document_title}] {chunk.content}"
            entry = _truncate(entry, remaining)
            knowledge_parts.append(entry)
            remaining -= len(entry)
        sections += ["", "REMOTESEA KNOWLEDGE", "\n\n".join(knowledge_parts)]

    sections += ["", "USER QUESTION", question]

    return "\n".join(sections)
