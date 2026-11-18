from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

    flows = relationship("Flow", back_populates="owner", cascade="all, delete-orphan")


class Flow(Base):
    __tablename__ = "flows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    view_name = Column(String, index=True, nullable=False)
    nodes_json = Column(Text, nullable=False)
    edges_json = Column(Text, nullable=False)

    owner = relationship("User", back_populates="flows")
