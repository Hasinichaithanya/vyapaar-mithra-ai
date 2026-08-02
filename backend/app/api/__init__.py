from .business_routes import router as business_router
from .bill_routes import router as bill_router
from .inventory_routes import router as inventory_router
from .forecast_routes import router as forecast_router
from .chat_routes import router as chat_router
from .dashboard_routes import router as dashboard_router
from .seed_routes import router as seed_router

__all__ = [
    "business_router",
    "bill_router",
    "inventory_router",
    "forecast_router",
    "chat_router",
    "dashboard_router",
    "seed_router",
]
