# 🗺️ PalmDetect AI - Project Roadmap

This roadmap outlines the strategic vision and future development plans for **PalmDetect AI**. Our goal is to secure grant funding to evolve this prototype into a robust, scalable, and enterprise-ready agricultural tool.

## 📍 Phase 1: Foundation & Refinement (Current)
- [x] Train baseline YOLO model (`best.pt`) for palm detection.
- [x] Develop basic FastAPI backend for inference.
- [x] Develop React/Vite frontend with Dashboard and Live Detection.
- [x] Implement local SQLite database for history logging.
- [x] Create comprehensive README and initial setup guides.
- [ ] Add basic unit testing for the FastAPI backend (`pytest`).
- [ ] Implement robust error boundary handling in the React frontend.
- [ ] Add open-source License files.

## 🚀 Phase 2: Grant Application & Scalability (Next 3-6 Months)
*Focus: Preparing the system to handle multiple users and larger datasets.*
- **Authentication & Authorization:** 
  - Implement JWT-based user authentication.
  - Multi-tenant architecture (allow different plantations to have their own secure data silos).
- **Cloud Database Migration:** 
  - Migrate from SQLite to PostgreSQL hosted on AWS RDS or Supabase.
- **Enhanced AI Capabilities:**
  - Retrain model with a larger, more diverse dataset to improve confidence scores.
  - Implement Edge AI capabilities (running inference directly on mobile devices to save bandwidth).
- **Full-Stack Dockerization & CI/CD:**
  - Create a `docker-compose.yml` to spin up the frontend, backend, and database simultaneously.
  - Set up GitHub Actions for automated testing and deployment.

## 🌍 Phase 3: Mobile & Field Integration (6-12 Months)
*Focus: Taking the app directly to the plantation workers.*
- **Progressive Web App (PWA):**
  - Upgrade the React app to a PWA to allow offline logging and syncing when the internet connection is restored.
- **Mobile Application:**
  - Develop a React Native wrapper for native Android/iOS experiences.
- **Advanced Geotagging & Mapping:**
  - Integrate map views (e.g., Mapbox or Google Maps) on the dashboard to visualize harvest hotspots.

## 📈 Phase 4: Enterprise Analytics & API (1 Year+)
*Focus: Providing value to plantation managers and agricultural researchers.*
- **Yield Prediction:** 
  - Correlate detection data over time to forecast harvest yields.
- **Public API Access:** 
  - Allow third-party agricultural software to pull data from PalmDetect AI via secure API keys.
- **Multi-Language Support:** 
  - Localize the interface (Indonesian, Malay, English, etc.) for wider adoption.

---
*Note: This roadmap is a living document and will be updated based on user feedback, funding, and technological advancements.*
