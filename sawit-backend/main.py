from fastapi import FastAPI, File, UploadFile, Depends, Form
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
from PIL import Image
import io
import json
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from collections import defaultdict

import os

# ─────────────────────────────────────────────
# DATABASE SETUP
# ─────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sawit.db")
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Define what a "Log" looks like in the database
class DetectionLog(Base):
    __tablename__ = "history_logs"
    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(String, index=True)
    status = Column(String)
    confidence = Column(Float)
    time = Column(String)
    date = Column(String)
    imgUrl = Column(String)
    harvest_count = Column(Integer, default=0)
    not_harvest_count = Column(Integer, default=0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    boxes_json = Column(String, nullable=True)

# Create the database tables
Base.metadata.create_all(bind=engine)

# Dependency to get the DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─────────────────────────────────────────────
# FASTAPI APP & AI SETUP
# ─────────────────────────────────────────────
app = FastAPI(title="Sawit Scan AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

model = YOLO("best.pt")

# ─────────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────────
# Notice we added 'save: bool = False' to the parameters!
@app.post("/predict/")
async def predict_image(
    save: bool = False, 
    file: UploadFile = File(...), 
    lat: float = Form(None), 
    lng: float = Form(None), 
    db: Session = Depends(get_db)
):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))

    results = model.predict(image, conf=0.25, imgsz=640, verbose=False)
    
    detections = []
    harvest_count = 0
    not_harvest_count = 0
    
    for box in results[0].boxes:
        cls_name = results[0].names[int(box.cls[0])]
        detections.append({
            "class": cls_name,
            "confidence": round(float(box.conf[0]) * 100, 1),
            "bbox": box.xyxy[0].tolist()
        })
        if "harvest" in cls_name.lower() and "not" not in cls_name.lower():
            harvest_count += 1
        else:
            not_harvest_count += 1
    
    # ONLY save to the database if React explicitly asks for it (save=True)
    if save and len(results[0].boxes) > 0:
        now = datetime.now()
        timestamp_str = now.strftime('%Y%m%d-%H%M%S')
        
        # Save image to disk
        filename = f"LOG-{timestamp_str}.jpg"
        filepath = os.path.join("uploads", filename)
        image.convert("RGB").save(filepath, "JPEG")
        
        best_box = max(results[0].boxes, key=lambda x: x.conf[0])
        status = results[0].names[int(best_box.cls[0])]
        confidence = round(float(best_box.conf[0]) * 100, 1)
        
        new_log = DetectionLog(
            log_id=f"LOG-{timestamp_str}",
            status=status,
            confidence=confidence,
            time=now.strftime('%I:%M %p'),
            date=now.strftime('%b %#d, %Y'),
            imgUrl=f"/uploads/{filename}",
            harvest_count=harvest_count,
            not_harvest_count=not_harvest_count,
            latitude=lat,
            longitude=lng,
            boxes_json=json.dumps({
                "boxes": detections,
                "width": image.width,
                "height": image.height
            })
        )
        db.add(new_log)
        db.commit()

    return {"detections": detections}

@app.get("/history/")
def get_history(db: Session = Depends(get_db)):
    # Fetch all logs, newest first
    logs = db.query(DetectionLog).order_by(DetectionLog.id.desc()).all()
    return logs

@app.get("/dashboard-stats/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    logs = db.query(DetectionLog).all()

    # Calculate actual object counts
    harvest = sum(log.harvest_count for log in logs)
    not_harvest = sum(log.not_harvest_count for log in logs)
    total = harvest + not_harvest
    
    # Calculate average confidence
    avg_conf = sum(log.confidence for log in logs) / len(logs) if len(logs) > 0 else 0

    # Get the 4 most recent activities
    recent_logs = db.query(DetectionLog).order_by(DetectionLog.id.desc()).limit(4).all()
    recent_activity = []
    for r in recent_logs:
        is_harv = "harvest" in r.status.lower() and "not" not in r.status.lower()
        recent_activity.append({
            "status": r.status,
            "time": r.time,
            "isHarvest": is_harv
        })

    # Group data by date for the Trend Line Chart
    trend_dict = defaultdict(lambda: {"harvest": 0, "notHarvest": 0})
    for log in logs:
        is_harv = "harvest" in log.status.lower() and "not" not in log.status.lower()
        if is_harv:
            trend_dict[log.date]["harvest"] += 1
        else:
            trend_dict[log.date]["notHarvest"] += 1

    # Format for the React Recharts library (take the last 7 days of data)
    trend_data = []
    for date_str, counts in list(trend_dict.items())[-7:]:
        # Shorten "Jun 4, 2026" to just "Jun 4" for a cleaner chart
        short_date = date_str.split(',')[0] 
        trend_data.append({
            "name": short_date,
            "harvest": counts["harvest"],
            "notHarvest": counts["notHarvest"]
        })

    return {
        "total": total,
        "harvest": harvest,
        "notHarvest": not_harvest,
        "avgConfidence": round(avg_conf, 1),
        "trendData": trend_data,
        "recentActivity": recent_activity
    }

@app.get("/export-history/")
def export_history_csv(db: Session = Depends(get_db)):
    logs = db.query(DetectionLog).order_by(DetectionLog.id.desc()).all()
    csv_str = "Log ID,Status,Confidence,Date,Time,Harvest Count,Not Harvest Count,Latitude,Longitude\n"
    for log in logs:
        csv_str += f"{log.log_id},{log.status},{log.confidence},{log.date},{log.time},{log.harvest_count},{log.not_harvest_count},{log.latitude or ''},{log.longitude or ''}\n"
    return Response(
        content=csv_str,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=history_export.csv"}
    )