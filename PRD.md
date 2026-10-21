# Product Requirements Document (PRD): PalmDetect AI 🌴🤖

## 1. Introduction

**Project Name:** PalmDetect AI
**Document Status:** Draft
**Last Updated:** October 2026

### 1.1 Product Vision
PalmDetect AI is an intelligent web application designed for real-time oil palm (sawit) detection. Our goal is to empower plantation workers, managers, and agricultural researchers with a scalable, automated tool to detect and classify oil palm fruits (harvestable vs. non-harvestable) rapidly. This will streamline operations, increase yield accuracy, and reduce manual labor overhead.

### 1.2 Objectives and Goals
- **Automation:** Reduce the manual effort required in identifying harvestable oil palm bunches.
- **Accuracy:** Leverage state-of-the-art YOLO (You Only Look Once) models for high-confidence real-time detection.
- **Data-Driven Insights:** Provide plantation managers with clear dashboards, detection logs, and harvest trends.
- **Scalability:** Build a foundation capable of expanding from a local prototype to a multi-tenant, cloud-based enterprise solution.

---

## 2. Target Audience (User Personas)

1. **Plantation Worker/Harvester:** Uses the application in the field (via mobile or PWA in the future) to scan palms, identify harvest readiness, and log locations. Needs a fast, simple, and reliable interface.
2. **Plantation Manager:** Accesses the web dashboard from an office. Monitors aggregate data, analyzes harvest hotspots through geotagged logs, and exports CSV reports for yield forecasting.
3. **Agricultural Researcher/Data Scientist:** Interested in the raw detection data and model confidence scores to further fine-tune AI capabilities and study yield patterns.

---

## 3. Product Features & Requirements

### 3.1 Functional Requirements

#### Core Application (Frontend)
- **Live Detection Interface:** Users must be able to upload images or stream live video feeds for real-time inference.
- **Dashboard & Analytics:** An interactive dashboard (using Recharts) to visualize detection trends, harvest classifications, and overall statistics.
- **History Logs:** A detailed view of past detection events, including timestamps, object classifications, and confidence scores.
- **Export Functionality:** Ability to export detection history logs to CSV formats for external analysis.

#### System Engine (Backend & AI)
- **YOLO Integration:** Fast AI inference powered by Ultralytics YOLO models to identify palm fruits.
- **Classification System:** Detected objects must be categorically tagged as "harvest" or "not harvest".
- **Database Management:** An SQLite database (transitioning to PostgreSQL) to persist detection logs and metadata securely.
- **Geotagging Support:** The backend must accept and log latitude and longitude coordinates for each detection event.

### 3.2 Non-Functional Requirements

- **Performance:** Real-time inference should have minimal latency to support live video feeds effectively. The React frontend should load quickly and remain responsive.
- **Scalability:** The backend must be built asynchronously (FastAPI) to handle multiple simultaneous requests.
- **Usability:** The UI (TailwindCSS) must be intuitive, modern, and mobile-friendly/responsive.
- **Reliability:** Graceful error handling and robust error boundaries in the frontend to prevent application crashes during AI inference failures.

---

## 4. System Architecture

- **Frontend:** React 19, Vite, TailwindCSS, Lucide React (Icons), Recharts.
- **Backend:** FastAPI, Python, YOLO (Ultralytics), SQLAlchemy, SQLite.
- **Deployment:** Dockerized backend environment for seamless deployment and local execution.
- **Communication:** RESTful API between the React frontend and FastAPI backend.

---

## 5. User Flows

### Flow 1: Live Scanning & Logging
1. User navigates to the "Live Detection" page.
2. User grants camera permissions or uploads a pre-captured image.
3. The image/frame is sent to the FastAPI backend.
4. YOLO model processes the image and returns bounding boxes, labels, and confidence scores.
5. The frontend draws bounding boxes on the image/feed.
6. Detection metadata (class, timestamp, location) is saved to the database.

### Flow 2: Manager Analytics Review
1. Manager logs into the Dashboard.
2. The frontend requests aggregate data from the backend.
3. Recharts renders bar/line charts showing recent harvest metrics.
4. Manager navigates to "History Logs" and clicks "Export to CSV".
5. A downloadable CSV is generated for the manager to use in Excel/reporting tools.

---

## 6. Roadmap & Future Phases

Based on the strategic vision, the product is planned across the following phases:

### Phase 1: Foundation (Current)
- Establish baseline YOLO model, FastAPI backend, and React dashboard.
- Implement SQLite history logging and comprehensive documentation.

### Phase 2: Grant Application & Scalability (Next 3-6 Months)
- **Security:** Implement JWT-based user authentication and multi-tenant data silos.
- **Infrastructure:** Migrate from SQLite to Cloud PostgreSQL (AWS/Supabase). Add Docker Compose and CI/CD pipelines.
- **AI Improvements:** Retrain YOLO on a larger dataset and explore Edge AI for offline field inference.

### Phase 3: Mobile & Field Integration (6-12 Months)
- **Accessibility:** Upgrade to Progressive Web App (PWA) with offline syncing capabilities.
- **Native Experience:** Develop a React Native application.
- **Mapping:** Integrate Mapbox/Google Maps to visualize detection hotspots geographically.

### Phase 4: Enterprise Analytics & API (1 Year+)
- **Advanced Analytics:** Implement yield prediction forecasting based on historical detection trends.
- **Integration:** Launch a public API for third-party agricultural software integrations.
- **Localization:** Add multi-language support (Indonesian, Malay, English).

---
*This PRD is a living document and will be iteratively updated as the project secures funding and gathers user feedback.*
