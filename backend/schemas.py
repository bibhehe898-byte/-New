from pydantic import BaseModel


class UserCreate(BaseModel):
    username: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class FlowSave(BaseModel):
    nodes: list[dict]
    edges: list[dict]
