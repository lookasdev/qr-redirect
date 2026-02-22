# Scanvas 🎨

**Scanvas** is a modern, full-stack dynamic QR code manager and shortlink redirector. It allows marketers, developers, and businesses to generate static physical QR codes that can have their digital destination changed dynamically at any time.

Built for extreme scan-volume environments, physical QR deployments no longer require re-printing when a marketing campaign URL changes. 

## 🚀 Features

* **Dynamic Link Routing**: Update your destination URL on the fly without changing the physical QR artwork.
* **Pause & Resume**: Temporarily halt traffic with a custom offline page without breaking the shortlink.
* **Password Protection**: Gate your physical destinations behind an encrypted PIN challenge.
* **Blazing Fast Redirects**: Built on FastAPI with in-memory TTL caching for 0(1) latency redirect hopping.
* **Robust Analytics**: Track every single scan. View total lifetime engagement, last-30-day time-series data, origin Geographic heat maps, and a deep breakdown of Device/OS types.
* **Vector QR Generator**: Customize Foreground/Background colors, inject custom center logos, and export clean SVG files ready for high-fidelity physical printing.
* **Dark Mode**: Beautiful, modern TailwindCSS interfaces that support native light and dark modes.

## 🛠️ Tech Stack

### Frontend
* React 18 + TypeScript
* Vite (Optimized manual chunk splitting)
* TailwindCSS v4
* React Router v6
* Recharts (Data Visualization)
* qrcode.react (SVG Vector generation)

### Backend
* Python 3.12 + FastAPI
* MongoDB (via Motor Asyncio)
* Pydantic
* JWT (JSON Web Tokens via Jose/Passlib)
* cachetools (TTL memory store)

## 🏃‍♂️ Getting Started

### Prerequisites
* Node.js v18+
* Python 3.10+
* A generic MongoDB Connection URI 

### 1. Database Setup
Create an `.env` file in the `/backend` directory:
```env
MONGODB_URL="mongodb+srv://<user>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority"
SECRET_KEY="your-super-secret-jwt-key"
```

### 2. Backend Installation
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload
```
*The backend will boot up locally on `http://127.0.0.1:8000`*

### 3. Frontend Installation
```bash
cd frontend
npm install
npm run dev
```
*The React app will boot up on `http://localhost:5173`*

## 📦 Deployment Ready
The frontend is already configured with a `public/_redirects` file specifically formatted to allow seamless Single Page Application routing (SPA) when deployed statically on platforms like **Netlify** or **Vercel**. 

## License
MIT License
