from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.config import engine, Base
from app.routes import user_routes, employee_routes, department_routes
from app.models import user_db, department_db, employee_db

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "API Running"}


app.include_router(user_routes.router)
app.include_router(employee_routes.router)
app.include_router(department_routes.router)
