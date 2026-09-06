import atexit
import json
import logging
import queue
import threading
import time
import urllib.request
import urllib.error
from typing import Any, Dict, List, Optional

from sdk.src.observability.models import TracePayload, SpanPayload

logger = logging.getLogger("telemetria.sdk")


class _FlushRequest:
    def __init__(self):
        self.event = threading.Event()


class AsyncShipper:
    """
    Asynchronous, non-blocking telemetry shipper.
    Uses a background worker thread and bounded queue to ship traces to the backend.
    """

    def __init__(
        self,
        api_key: str,
        endpoint: str = "http://localhost:8000/v1/ingest",
        project_id: Optional[str] = None,
        batch_size: int = 25,
        flush_interval_seconds: float = 1.0,
        max_queue_size: int = 10000,
        client: Optional[Any] = None,
    ):
        self.api_key = api_key
        self.endpoint = endpoint
        self.project_id = project_id
        self.batch_size = batch_size
        self.flush_interval_seconds = flush_interval_seconds
        self.client = client
        self.queue: queue.Queue = queue.Queue(maxsize=max_queue_size)
        
        self._shutdown_event = threading.Event()
        self._worker_thread = threading.Thread(
            target=self._worker_loop, name="telemetria-shipper-worker", daemon=True
        )
        self._worker_thread.start()
        atexit.register(self.shutdown)

    def enqueue(self, payload: TracePayload | SpanPayload) -> bool:
        """
        Non-blocking enqueue.
        Returns True if queued, False if dropped due to buffer saturation.
        """
        try:
            self.queue.put_nowait(payload)
            return True
        except queue.Full:
            logger.warning("[Telemetria SDK] Buffer full (max %d). Dropping payload.", self.queue.maxsize)
            return False

    def flush(self, timeout: float = 5.0) -> bool:
        """Flush all pending queued traces and blocks until shipped."""
        req = _FlushRequest()
        try:
            self.queue.put(req, timeout=timeout)
            return req.event.wait(timeout=timeout)
        except queue.Full:
            return False

    def shutdown(self, timeout: float = 3.0) -> None:
        """Gracefully drain queue and stop background worker thread."""
        if self._shutdown_event.is_set():
            return
        self.flush(timeout=timeout)
        self._shutdown_event.set()
        if self._worker_thread.is_alive():
            self._worker_thread.join(timeout=1.0)

    def _worker_loop(self) -> None:
        batch_traces: List[Dict[str, Any]] = []
        batch_spans: List[Dict[str, Any]] = []
        last_flush = time.time()

        while not self._shutdown_event.is_set() or not self.queue.empty():
            try:
                # Wait up to flush_interval for new items
                timeout = max(0.05, self.flush_interval_seconds - (time.time() - last_flush))
                item = self.queue.get(timeout=timeout)
                if isinstance(item, _FlushRequest):
                    if batch_traces or batch_spans:
                        self._send_batch(batch_traces, batch_spans)
                        batch_traces = []
                        batch_spans = []
                        last_flush = time.time()
                    item.event.set()
                elif isinstance(item, TracePayload):
                    batch_traces.append(item.to_dict())
                elif isinstance(item, SpanPayload):
                    batch_spans.append(item.to_dict())
                self.queue.task_done()
            except queue.Empty:
                pass

            now = time.time()
            is_time_to_flush = (now - last_flush) >= self.flush_interval_seconds
            is_batch_full = (len(batch_traces) + len(batch_spans)) >= self.batch_size

            if (is_time_to_flush or is_batch_full) and (batch_traces or batch_spans):
                self._send_batch(batch_traces, batch_spans)
                batch_traces = []
                batch_spans = []
                last_flush = now

        # Final drain
        if batch_traces or batch_spans:
            self._send_batch(batch_traces, batch_spans)

    def _send_batch(self, traces: List[Dict[str, Any]], spans: List[Dict[str, Any]]) -> None:
        payload = {
            "traces": traces,
            "spans": spans,
        }
        data = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "Telemetria-Python-SDK/1.0.0",
        }

        if self.client is not None:
            try:
                resp = self.client.post(self.endpoint, json=payload, headers=headers)
                return
            except Exception as e:
                logger.error("[Telemetria SDK] Client post failed: %s", e)
                return

        req = urllib.request.Request(self.endpoint, data=data, headers=headers, method="POST")
        for attempt in range(3):
            try:
                with urllib.request.urlopen(req, timeout=10.0) as response:
                    if response.status in (200, 201):
                        return
            except urllib.error.HTTPError as e:
                logger.error("[Telemetria SDK] Ingest HTTP error %s: %s", e.code, e.read().decode("utf-8", "replace"))
                break  # Do not retry 4xx errors
            except Exception as e:
                time.sleep(0.1 * (2 ** attempt))
                if attempt == 2:
                    logger.error("[Telemetria SDK] Failed to ship telemetry after 3 attempts: %s", e)
