from fastapi import APIRouter, HTTPException

from ....models.schemas import EntityResponse, EntityRelationship
from ....services.elasticsearch_service import get_entities

router = APIRouter(tags=["entities"])


@router.get("/entities/relationships")
async def get_entity_relationships_endpoint(min_doc_count: int = 2):
    try:
        response = get_entities(min_doc_count=min_doc_count)

        relationships = []
        for participant_bucket in response["aggregations"]["participants"]["buckets"]:
            source = participant_bucket["key"]
            for co_participant in participant_bucket["co_participants"]["buckets"]:
                target = co_participant["key"]
                if source != target:
                    relationships.append(
                        EntityRelationship(
                            source=source,
                            target=target,
                            weight=co_participant["doc_count"],
                            common_artifacts=[],
                        )
                    )

        return EntityResponse(relationships=relationships, took=response["took"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Entity analysis failed: {str(e)}")
