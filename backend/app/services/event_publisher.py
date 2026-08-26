import asyncio
import json

class EventPublisher:
    subscribers = set()

    @classmethod
    def subscribe(cls):
        q = asyncio.Queue()
        cls.subscribers.add(q)
        return q

    @classmethod
    def unsubscribe(cls, q):
        if q in cls.subscribers:
            cls.subscribers.remove(q)

    @classmethod
    def publish(cls, event_name: str, data: dict):
        for q in list(cls.subscribers):
            try:
                q.put_nowait({"event": event_name, "data": data})
            except Exception:
                pass
