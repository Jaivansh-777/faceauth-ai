from sqlalchemy import Column, Integer, String, Boolean, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    role = Column(String(50), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    face_samples = relationship("FaceSample", back_populates="user", cascade="all, delete-orphan")
    auth_logs = relationship("AuthLog", back_populates="user")


class FaceSample(Base):
    __tablename__ = "face_samples"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(512), nullable=False)
    quality_score = Column(Float, default=1.0)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="face_samples")


class AuthLog(Base):
    __tablename__ = "auth_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user_name = Column(String(255), nullable=True)
    confidence = Column(Float, nullable=True)
    success = Column(Boolean, default=False)
    camera_id = Column(String(100), nullable=True)
    failure_reason = Column(Text, nullable=True)
    screenshot_path = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="auth_logs")
