from datetime import datetime, timezone

from fastapi import FastAPI
from pydantic import BaseModel
from sqlalchemy import JSON, DateTime, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


app = FastAPI()
engine = create_engine("sqlite:///./multidoc.db") # “sqlite:” 表示用sqlite这种数据库 “///” 本地 “./”当前文件所在文件夹下的文件
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