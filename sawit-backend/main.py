from fastapi import FastAPI, File, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
from PIL import Image
import io
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from collections import defaultdict

# ─────────────────────────────────────────────
# DATABASE SETUP (SQLite)
# ─────────────────────────────────────────────
SQLALCHEMY_DATABASE_URL = "sqlite:///./sawit.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
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

model = YOLO("best.pt")

# ─────────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────────
# Notice we added 'save: bool = False' to the parameters!
@app.post("/predict/")
async def predict_image(save: bool = False, file: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await file.read()
    image = Image.open(io.BytesIO(image_bytes))

    results = model.predict(image, conf=0.25, imgsz=640, verbose=False)
    
    detections = []
    
    # ONLY save to the database if React explicitly asks for it (save=True)
    if save and len(results[0].boxes) > 0:
        now = datetime.now()
        best_box = max(results[0].boxes, key=lambda x: x.conf[0])
        status = results[0].names[int(best_box.cls[0])]
        confidence = round(float(best_box.conf[0]) * 100, 1)
        
        new_log = DetectionLog(
            log_id=f"LOG-{now.strftime('%Y%m%d-%H%M%S')}",
            status=status,
            confidence=confidence,
            time=now.strftime('%I:%M %p'),
            date=now.strftime('%b %#d, %Y'),
            imgUrl="https://images.unsplash.com/photo-1590059530419-7e39f37c35bd?auto=format&fit=crop&w=120&q=80"
        )
        db.add(new_log)
        db.commit()

    # Always process the boxes to draw on the screen
    for box in results[0].boxes:
        detections.append({
            "class": results[0].names[int(box.cls[0])],
            "confidence": round(float(box.conf[0]) * 100, 1),
            "bbox": box.xyxy[0].tolist()
        })

    return {"detections": detections}

@app.get("/history/")
def get_history(db: Session = Depends(get_db)):
    # Fetch all logs, newest first
    logs = db.query(DetectionLog).order_by(DetectionLog.id.desc()).all()
    return logs

@app.get("/dashboard-stats/")
def get_dashboard_stats(db: Session = Depends(get_db)):
    logs = db.query(DetectionLog).all()

    total = len(logs)
    
    # Calculate counts
    harvest = sum(1 for log in logs if "harvest" in log.status.lower() and "not" not in log.status.lower())
    not_harvest = total - harvest
    
    # Calculate average confidence
    avg_conf = sum(log.confidence for log in logs) / total if total > 0 else 0

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