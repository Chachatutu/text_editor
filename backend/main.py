from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi import HTTPException
from pydantic import BaseModel
from sqlalchemy import JSON, DateTime, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from pathlib import Path

app = FastAPI()
DATA_PATH = Path(__file__).resolve().parent / "multidoc.db"
URL_OF_DATABASE = f"sqlite:///{DATA_PATH.as_posix()}"
engine = create_engine(URL_OF_DATABASE) 
SessionLocal = sessionmaker(bind=engine) 

#自己建一个父类，方便批量管理数据表以及分层管理通用属性
class Base(DeclarativeBase):
    pass

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String)
    content: Mapped[dict] = mapped_column(JSON)
    created_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class DocumentCreate(BaseModel):
    title: str
    content: dict

class DocumentUpdate(BaseModel):
    title: str
    content: dict

Base.metadata.create_all(engine)

@app.get("/")
def read_root():
    return {"message": "Welcome to MultiDoc Editor!"}

@app.post("/api/documents", status_code=201)
def create_document(data: DocumentCreate):
    with SessionLocal() as session:
        now = datetime.now(timezone.utc)
        document = Document(
            title = data.title,
            content = data.content,
            created_time = now,
            updated_time = now
        )
        session.add(document)
        session.commit()
        session.refresh(document)

    return {
        "id" : document.id,
        "title" : document.title,
        "content" : document.content,
        "created_time" : document.created_time,
        "updated_time" : document.updated_time
    }

@app.put("/api/documents/{item_id}")
def update_item(item_id: int, data: DocumentUpdate):
    with SessionLocal() as session:
        now = datetime.now(timezone.utc)
        
        item = session.get(Document, item_id)
        if item is None:
            raise HTTPException(status_code=404, detail="没有对应文件")
        
        item.title = data.title
        item.content = data.content
        item.updated_time = now

        session.commit()
        session.refresh(item)

    return {
        "id" : item.id,
        "title" : item.title,
        "content" : item.content,
        "created_time" : item.created_time,
        "updated_time" : item.updated_time
    }
