from typing import Any, Dict, List


def format_data(response: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "hits": response.get("hits", {}).get("hits", []),
        "total": response.get("hits", {}).get("total", {}).get("value", 0),
        "took": response.get("took", 0),
    }


def clean_text(query: str) -> str:
    return query.strip().replace("'", "\\'").replace('"', '\\"')


def paginate_list(results: List[Any], page: int = 1, size: int = 10) -> Dict[str, Any]:
    start = (page - 1) * size
    end = start + size
    return {
        "items": results[start:end],
        "page": page,
        "size": size,
        "total": len(results),
        "has_next": end < len(results),
    }
