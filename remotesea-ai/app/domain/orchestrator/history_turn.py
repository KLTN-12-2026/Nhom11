from dataclasses import dataclass


@dataclass
class HistoryTurn:
    question: str
    answer: str
