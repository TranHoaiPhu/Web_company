import time
import functools
from typing import Callable, Any
from postgrest.exceptions import APIError
import httpx

def with_retry(max_retries: int = 3, delay: float = 1.0):
    """
    Decorator to retry database operations on transient errors like 'Server disconnected'.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (APIError, httpx.HTTPError, ConnectionError) as e:
                    last_exception = e
                    # Check if it's a transient error (like server disconnected or timeout)
                    error_msg = str(e).lower()
                    if "disconnected" in error_msg or "timeout" in error_msg or "refused" in error_msg or attempt < max_retries - 1:
                        print(f"⚠️ Transient DB error on {func.__name__} (attempt {attempt + 1}/{max_retries}): {e}")
                        time.sleep(delay * (2 ** attempt)) # Exponential backoff
                        continue
                    raise
            raise last_exception
        return wrapper
    return decorator
