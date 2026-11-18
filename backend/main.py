import json
import time

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from . import models, schemas
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Kataxone Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Настройки безопасности ---
SECRET_KEY = "CHANGE_ME_IN_PRODUCTION_USE_ENV"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 часа

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(username: str) -> str:
    payload = {
        "sub": username,
        "exp": int(time.time()) + ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Не удалось проверить учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


@app.post("/api/register", status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")

    user = models.User(
        username=user_data.username,
        password_hash=hash_password(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.username)
    return {"access_token": token, "token_type": "bearer", "username": user.username}


@app.post("/api/login")
def login(user_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
        )

    token = create_access_token(user.username)
    return {"access_token": token, "token_type": "bearer", "username": user.username}


@app.get("/api/flows/{view_name}")
def get_flow(
    view_name: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    flow = (
        db.query(models.Flow)
        .filter(models.Flow.user_id == current_user.id, models.Flow.view_name == view_name)
        .first()
    )
    if not flow:
        raise HTTPException(status_code=404, detail="Граф не найден")

    return {
        "view_name": flow.view_name,
        "nodes": json.loads(flow.nodes_json),
        "edges": json.loads(flow.edges_json),
    }


@app.post("/api/flows/{view_name}")
def save_flow(
    view_name: str,
    flow_data: schemas.FlowSave,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    flow = (
        db.query(models.Flow)
        .filter(models.Flow.user_id == current_user.id, models.Flow.view_name == view_name)
        .first()
    )

    nodes_json = json.dumps(flow_data.nodes, ensure_ascii=False)
    edges_json = json.dumps(flow_data.edges, ensure_ascii=False)

    if flow:
        flow.nodes_json = nodes_json
        flow.edges_json = edges_json
    else:
        flow = models.Flow(
            user_id=current_user.id,
            view_name=view_name,
            nodes_json=nodes_json,
            edges_json=edges_json,
        )
        db.add(flow)

    db.commit()
    db.refresh(flow)

    return {"view_name": flow.view_name, "saved": True}
