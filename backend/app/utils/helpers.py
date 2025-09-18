"""Helper utilities and common functions."""

from typing import Any, Dict, List


def format_elasticsearch_response(response: Dict[str, Any]) -> Dict[str, Any]:
    """Format Elasticsearch response for consistent API output."""
    return {
        "hits": response.get("hits", {}).get("hits", []),
        "total": response.get("hits", {}).get("total", {}).get("value", 0),
        "took": response.get("took", 0)
    }


def sanitize_query(query: str) -> str:
    """Sanitize search query to prevent injection attacks."""
    # Basic sanitization - can be enhanced
    return query.strip().replace("'", "\\'").replace('"', '\\"')


def paginate_results(results: List[Any], page: int = 1, size: int = 10) -> Dict[str, Any]:
    """Paginate results for API responses."""
    start = (page - 1) * size
    end = start + size
    
    return {
        "items": results[start:end],
        "page": page,
        "size": size,
        "total": len(results),
        "has_next": end < len(results)
    }
