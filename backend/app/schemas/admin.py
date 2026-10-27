"""Schemas for the admin console (admin only)."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import UserRole


def _not_blank(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("must not be blank")
    return v


class BatchRef(BaseModel):
    id: uuid.UUID
    name: str
    academic_year: str
    is_archived: bool = False


class AdminUserOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    roll_number: Optional[str] = None
    role: UserRole
    is_active: bool
    account_state: str  # invited | active | deactivated
    invitation: Optional[str] = None  # sent | failed | console (email off) | None
    credentials_sent_at: Optional[datetime] = None
    batch: Optional[BatchRef] = None  # students: their one batch
    batches: list[BatchRef] = []  # instructors: the batches they teach


class InstructorRef(BaseModel):
    id: uuid.UUID
    full_name: str
    is_active: bool


class AdminBatchOut(BaseModel):
    id: uuid.UUID
    name: str
    academic_year: str
    is_archived: bool
    created_at: datetime
    instructor: Optional[InstructorRef] = None
    student_count: int


class AdminBatchDetail(AdminBatchOut):
    students: list[AdminUserOut]


class BatchCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    academic_year: str = Field(min_length=1, max_length=20)

    @field_validator("name", "academic_year")
    @classmethod
    def clean_text(cls, v: str) -> str:
        return _not_blank(v)


class BatchUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    academic_year: Optional[str] = Field(default=None, min_length=1, max_length=20)

    @field_validator("name", "academic_year")
    @classmethod
    def clean_text(cls, v: Optional[str]) -> Optional[str]:
        return v if v is None else _not_blank(v)


class InstructorCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr

    @field_validator("full_name")
    @classmethod
    def clean_text(cls, v: str) -> str:
        return _not_blank(v)


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=1, max_length=150)
    email: Optional[EmailStr] = None
    roll_number: Optional[str] = Field(default=None, max_length=50)  # students only

    @field_validator("full_name", "roll_number")
    @classmethod
    def clean_text(cls, v: Optional[str]) -> Optional[str]:
        return v if v is None else _not_blank(v)


class StudentCreate(BaseModel):
    """One student added by hand (the same checks as a row of the import file)."""
    roll_number: str = Field(min_length=1, max_length=50)
    full_name: str = Field(min_length=1, max_length=150)
    email: EmailStr
    batch_id: uuid.UUID

    @field_validator("roll_number", "full_name")
    @classmethod
    def clean_text(cls, v: str) -> str:
        return _not_blank(v)


class MoveStudent(BaseModel):
    batch_id: uuid.UUID


class SetInstructor(BaseModel):
    instructor_id: uuid.UUID


class ImportRowResult(BaseModel):
    row: int  # spreadsheet row number
    urn: str
    name: str
    email: str
    status: str  # preview: ready | skipped | invalid   import: created | enrolled | skipped | invalid
    reason: Optional[str] = None


class ImportResult(BaseModel):
    preview: bool
    total: int
    ready: int  # rows that will be (or were) added
    created: int  # new accounts created (import only)
    skipped: int
    invalid: int
    rows: list[ImportRowResult]
