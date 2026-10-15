# AeroNex — Air Pollution & Weather Forecasting System

**Predicting air. Understanding weather.**

AeroNex is an air pollution and weather intelligence platform designed to monitor air quality, visualize environmental conditions, and forecast future Air Quality Index (AQI) levels, with an initial focus on Delhi NCR, India.

The project combines a modern web dashboard, environmental data sources, and machine learning to help users understand pollution trends and explore how weather conditions relate to air quality.

## 🌐 Live Demo

- **Live Website:** https://aeronex-frontend.onrender.com/
- **Backend API:** https://aeronex-wo48.onrender.com/
- **API Documentation:** https://aeronex-wo48.onrender.com/docs
- **GitHub Repository:** https://github.com/HinguJay27/AeroNex

## 🎯 Project Objective

Air pollution is a major environmental challenge, particularly in densely populated urban areas. AeroNex aims to make environmental information easier to understand by bringing air quality monitoring, weather information, historical trends, and future AQI forecasts into one platform.

The system is developed as a prototype for the **Smart India Hackathon (SIH)** problem statement: *Air Pollution–Weather Coupled Forecasting System (Delhi NCR Focus).*

## ✨ Key Features

- **AQI Monitoring:** View air quality information for selected monitoring stations.
- **AQI Forecasting:** Explore predicted air quality across multiple forecast horizons.
- **Weather Integration:** Connect weather conditions with air pollution analysis.
- **Interactive Dashboard:** Access environmental indicators, charts, and summaries in one place.
- **Map View:** Explore the air quality monitoring experience through a geographical interface.
- **Historical Data:** Review available past air quality information and trends.
- **Environmental Insights:** Understand patterns and relationships between weather and pollution.
- **Alerts:** Access the platform's air quality alert interface.
- **User Authentication:** Login and registration with Supabase authentication, including Google sign-in.
- **Responsive Interface:** A modern dashboard designed for convenient use across screen sizes.
- **Cloud Deployment:** Frontend and backend hosted separately on Render.

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, TypeScript, Vite |
| Styling | CSS |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Python, FastAPI |
| Machine Learning | Python, scikit-learn-compatible model artifacts |
| Data Processing | Pandas, NumPy (as required by the backend) |
| Authentication | Supabase Auth |
| Environmental Data | Open-Meteo and CPCB India AQI standards |
| Model Storage | Joblib model files |
| Deployment | Render |
| Version Control | Git and GitHub |

## 🏗️ System Architecture

The application follows a frontend–backend architecture.

```text
                 USER
                   |
                   v
        React + TypeScript Frontend
                   |
                   v
              API Requests
                   |
                   v
           FastAPI Backend
                   |
          +--------+--------+
          |                 |
          v                 v
    Data Fetching      ML Prediction
          |                 |
          v                 v
   Weather / AQI Data   Trained Models
          |                 |
          +--------+--------+
                   |
                   v
        Processed Forecast Results
                   |
                   v
        Dashboard and Visualizations
```

**Deployment architecture**

- Frontend: Render Static Site
- Backend: Render Web Service
- Authentication: Supabase Auth

## 🔮 Forecasting Horizons

AeroNex is designed to support the following forecast horizons:

`1, 2, 4, 6, 8, 12, 24, 36, 48, 60, 72 hours`

The available predictions depend on the backend model and data pipeline. Forecasts are estimates and should not be treated as official air quality measurements.

## 📁 Project Structure

The repository is organized into frontend and backend components.

```text
AeroNex/
│
├── ml-backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── aqi.py
│   │   ├── data_fetcher.py
│   │   ├── predict.py
│   │   └── train.py
│   │
│   ├── models/
│   │   └── *.joblib
│   │
│   ├── requirements.txt
│   └── run.py
│
├── src/
│   ├── assets/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── .env.example
├── package.json
└── README.md
```

*Note: This is a representative structure. Adjust the frontend paths and optional files to match the current repository.*

## ⚙️ Installation and Setup

### Prerequisites

Install the following before running AeroNex locally:

- Node.js and npm
- Python 3.10 or a version supported by the backend dependencies
- Git

### 1. Clone the repository

```bash
git clone https://github.com/HinguJay27/AeroNex.git
cd AeroNex
```

### 2. Set up the frontend

Open a terminal in the frontend project directory, where `package.json` is located.

Install the dependencies:

```bash
npm install
```

Create a `.env.local` file in the frontend root directory and configure the backend URL:

```env
VITE_ML_BACKEND_URL=http://localhost:8000
```

Add your Supabase project URL and publishable key using the exact environment variable names expected by the project's Supabase configuration.

Start the development server:

```bash
npm run dev
```

Open the local URL printed in the terminal, usually `http://localhost:5173`.

### 3. Set up the backend

Open another terminal:

```bash
cd ml-backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

On Windows PowerShell:

```powershell
.\venv\Scripts\Activate.ps1
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python run.py
```

The backend should be available at:

```text
http://localhost:8000
```

Interactive API documentation:

```text
http://localhost:8000/docs
```

Make sure the required trained model files and any required data-source configuration are available before testing prediction endpoints.


## 🚀 Deployment

AeroNex is deployed using Render.

**Frontend deployment**
1. Connect the GitHub repository to Render.
2. Select the frontend directory as the root directory if the repository is configured as a monorepo.
3. Configure the build command, typically `npm install && npm run build`.
4. Set the publish directory to `dist`.
5. Configure `VITE_ML_BACKEND_URL` with the deployed backend URL.
6. Add the required public Supabase configuration.
7. Deploy the site.

**Backend deployment**
1. Create a Render Web Service connected to the repository.
2. Set the root directory to `ml-backend`.
3. Install dependencies from `requirements.txt`.
4. Use the project's supported startup command, such as `python run.py`.
5. Configure the required environment variables and model files.
6. Deploy and test the API documentation endpoint.

After deployment, verify that the frontend can communicate with the backend and that authentication redirects and forecast requests work correctly.

## 📊 Data Sources and AQI

AeroNex uses Open-Meteo for weather-related data integration and references the Central Pollution Control Board (CPCB) India AQI framework for air quality interpretation.

Weather measurements, pollutant concentrations, and AQI values are different types of information. Forecast accuracy depends on data availability, data quality, model training, and the conditions represented in the training data.

## 🔭 Future Enhancements

- Improve forecast accuracy with additional historical observations and weather variables.
- Expand coverage beyond Delhi NCR to more Indian cities.
- Add forecast confidence intervals and model performance metrics.
- Provide configurable notifications for unhealthy air quality.
- Improve historical analysis and downloadable reports.
- Add richer station-level comparisons and geographical visualizations.
- Introduce automated model evaluation and periodic retraining.
- Optimize mobile usability and accessibility.

## 🎓 Project Information

**Project Name:** AeroNex  
**Domain:** Environmental Monitoring, Weather Analytics, and Machine Learning  
**Problem Statement:** Air Pollution–Weather Coupled Forecasting System (Delhi NCR Focus)  
**Project Type:** Web-Based Environmental Intelligence Platform  
**Deployment:** Render  
**Authentication:** Supabase

## 👨‍💻 Author

**Jay Hingu**

GitHub: https://github.com/HinguJay27

## 📄 Disclaimer

AeroNex is an academic and prototype project intended for environmental awareness, experimentation, and forecasting research. Predictions may differ from actual conditions and should not replace official CPCB advisories, government monitoring data, or emergency guidance.

---

**AeroNex — Predicting air. Understanding weather.**
