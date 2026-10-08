from fastapi import APIRouter
from pathlib import Path

router = APIRouter(prefix="/api/repositories", tags=["repositories"])

@router.get("/sample")
def get_sample_repo_info():
    sample_path = Path("sample_repo").resolve()
    has_sample = sample_path.exists() and any(sample_path.iterdir())
    return {
        "name": "nexus-sample-app",
        "type": "Product Catalog & Storefront",
        "description": "Standard e-commerce storefront app with product cards, category filters, and search.",
        "default_feature": "Add a wishlist button to every product card with live item counter badge and mobile responsive layout.",
        "path": str(sample_path) if has_sample else None
    }
