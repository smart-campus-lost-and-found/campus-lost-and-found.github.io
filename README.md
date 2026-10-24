# Chandigarh University (CU) Lost & Found Portal
**Official Campus Custody, Verification & Full-Stack Recovery System**

A modern, production-ready, full-stack web application for managing lost and found belongings across Chandigarh University (CU) campuses. Built to enterprise university standards with real-time multi-filter cataloging, persistent backend REST API, claim verification workflows, 4-stage tracking pipelines, printable gate pass handover slips, and an authorized security desk console.

---

## 🏗️ Full-Stack System Architecture

```text
┌────────────────────────────────────────┐
│           Frontend (Client)            │  Hosted on GitHub Pages / Vercel
│     index.html + css/ + js/            │  (Responsive, Accessible UI)
└───────────────────┬────────────────────┘
                    │ REST API Requests (JSON / CORS enabled)
                    ▼
┌────────────────────────────────────────┐
│        Node.js Backend Server          │  server/server.js
│        REST API & Verification         │  Zero external npm dependencies needed!
└───────────────────┬────────────────────┘
                    │ Atomic File Persistence
                    ▼
┌────────────────────────────────────────┐
│       Central Campus Database          │  server/data/database.json
│    25+ Pre-Seeded CU Campus Items      │  Persists claims, items, & statuses
└────────────────────────────────────────┘
```

---

## 🌟 Key Features

1. **Official University Branding & Aesthetics**
   - Official Chandigarh University Deep Navy (`#0a1733`) & Academic Gold (`#e59f2c`) color palette.
   - Distinctive custom university crest vector emblem and accreditation badges.
   - Real-time campus statistics: Total logged items, resolved cases, active inquiries, and recovery percentage.
   - Dark Mode / Light Mode toggle with persistence.
   - Live Backend Status Pill in top bar (`🟢 Cloud DB Connected` or `🟡 Local Storage Mode`).

2. **Persistent Backend REST API (`server/server.js`)**
   - Built using Node.js standard modules with **zero required external npm dependencies**.
   - Automatic database creation and seeding from `server/seeds/seed_data.json` on first run.
   - **REST API Endpoints**:
     - `GET /api/health` — Service health check
     - `GET /api/stats` — Live campus resolution metrics
     - `GET /api/items` — Query lost & found records with multi-filter search
     - `GET /api/items/:id` — Track single report or search by student UID
     - `POST /api/items` — Register new lost or found report
     - `POST /api/items/:id/claim` — Submit ownership verification claim
     - `PATCH /api/items/:id/status` — Security staff advance/approve status
     - `POST /api/admin/reset` — Reset database to official university seed dataset

3. **Rich & Authentic Campus Dataset**
   - 20+ realistic pre-seeded items across key CU buildings (Central Library, Block A1 Tech Hub, Block B3 Mechanical Labs, Student Activity Centre, Food Courts 1 & 4, Sports Arena, Gate 1 Security, Shivalik Boys & Sukhna Girls Hostels).
   - Real categories: ID Cards & Documents, Electronics & Gadgets, Bags, Wallets, Smart Fobs & Keys, Books, Wearables, Apparel, Flasks.
   - Realistic student UIDs (e.g. `24BCS10884`, `23BCS80112`, `22BBA10234`).

4. **Guided Reporting Wizard**
   - Step-by-step reporting for both "Found an Item" and "Lost a Belonging".
   - Client-side image upload with HTML5 canvas automatic compression (instant preview & storage efficiency).
   - **Secret Identification Detail**: Enforces an anti-fraud private question (wallpaper description, serial number, coin count) kept hidden from public view.
   - Automatic reference ID generation: `CU-LF-2026-XXXX`.

5. **Live 4-Stage Progress Tracker**
   - Search by Reference Code or Student UID.
   - Visual timeline stepper with 4 audit stages:
     1. Reported / Logged in Central Register
     2. Claim Under Review by Security
     3. Matched & Cleared for Pickup at Gate 1
     4. Returned & Safely Handed Over
   - Dedicated in-person collection instructions for students.
   - **Printable Handover Certificate / Gate Pass** with student signature line, security officer seal, and item verification table.

6. **Campus Security & Staff Console**
   - 1-click Security Staff Mode for duty officers.
   - Review submitted student claims with private verification details.
   - Advance items through the workflow: Approve claims, mark ready for pickup, or confirm final physical handover.
   - Quick database reset button to restore default sample records at any time.

---

## 🚀 How to Run the Backend Server

### Locally on Windows:
1. Double-click [**`start-server.bat`**](file:///C:/Users/lenovo/.gemini/antigravity/scratch/cu-lost-and-found-portal/start-server.bat)
2. Or in terminal:
   ```bash
   node server/server.js
   ```
3. Open `http://localhost:5000` in your browser.

---

## ☁️ 1-Click Free Cloud Deployment for the Backend

To let all students on any device share the live database online:

### Deploy Backend to Render.com (100% Free):
1. Create a free account at [render.com](https://render.com).
2. Click **New + ➔ Web Service**.
3. Connect your GitHub repository.
4. Set:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `node server/server.js`
5. Click **Deploy Web Service**.
6. Render gives you a free live backend URL (e.g. `https://cu-lost-found-api.onrender.com`).
7. Open your website on GitHub Pages ➔ Click the **`🟡 Local Storage Mode`** button in the top navigation bar ➔ Paste your Render backend URL!
8. Your entire student body and security desks will now be linked in real time!

---

## 📁 Full-Stack Project Structure

```text
cu-lost-and-found-portal/
├── server/
│   ├── server.js          # REST API Server (Node.js, zero dependencies required)
│   ├── package.json       # Backend metadata & scripts
│   ├── seeds/
│   │   └── seed_data.json # Canonical 20+ item Chandigarh University dataset
│   └── data/
│       └── database.json  # Persistent JSON database (auto-created on boot)
├── api/                   # Vercel / Netlify Serverless API Functions
│   ├── items.js
│   └── stats.js
├── css/
│   └── styles.css         # University master design system
├── js/
│   ├── api.js             # Central REST API connector with hybrid offline fallback
│   ├── data.js            # Campus categories & location schema
│   └── app.js             # Application controller & view router
├── index.html             # Master web application document
├── standalone.html        # All-in-one bundled offline version
├── Procfile               # Cloud deployment config (Render / Railway)
├── start-server.bat       # 1-click Windows server launcher
├── vercel.json            # Vercel hosting rules
├── netlify.toml           # Netlify hosting rules
└── README.md              # Documentation
```

---

&copy; 2026 Chandigarh University. Department of Student Welfare & Campus Security Command.
