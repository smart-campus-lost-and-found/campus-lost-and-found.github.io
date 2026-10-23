# Chandigarh University (CU) Lost & Found Portal
**Official Campus Custody, Verification & Recovery Portal**

A modern, production-ready, zero-dependency official web application for managing lost and found belongings across Chandigarh University (CU) campuses. Built to enterprise university standards with real-time multi-filter cataloging, claim verification workflows, 4-stage tracking pipelines, printable gate pass handover slips, and an authorized security desk console.

---

## 🌟 Key Features

1. **Official University Branding & Aesthetics**
   - Official Chandigarh University Deep Navy & Academic Gold color palette.
   - Distinctive custom university crest vector emblem and accreditation badges.
   - Real-time campus statistics: Total logged items, resolved cases, active inquiries, and recovery percentage.
   - Dark Mode / Light Mode toggle with persistence.

2. **Rich & Authentic Campus Dataset**
   - 20+ realistic pre-seeded items across key CU buildings (Central Library, Block A1 Tech Hub, Block B3 Mechanical Labs, Student Activity Centre, Food Courts 1 & 4, Sports Arena, Gate 1 Security, Shivalik Boys & Sukhna Girls Hostels).
   - Real categories: ID Cards & Documents, Electronics & Gadgets, Bags, Wallets, Smart Fobs & Keys, Books, Wearables, Apparel, Flasks.
   - Realistic student UIDs (e.g. `24BCS10884`, `23BCS80112`, `22BBA10234`).

3. **Live Search & Multi-Filter Directory**
   - Real-time instant search with keyboard shortcut (`/`).
   - Category filter pills with live item count counters.
   - Segmented toggle for Lost Reports vs Found Items.
   - Campus block & building dropdown filter.
   - Lifecycle stage filter (Reported, Claim Under Review, Ready for Pickup, Returned).

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

## 🚀 Instant Deployment Guide

This project is completely static (HTML5, Vanilla CSS3, ES6 JavaScript) with zero runtime dependencies. It can be deployed in under 60 seconds on any web hosting platform.

### Option 1: GitHub Pages (Free)
1. Initialize a git repository and commit the files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of CU Lost & Found Portal"
   ```
2. Push to your GitHub repository:
   ```bash
   git remote add origin https://github.com/<your-username>/cu-lost-and-found.git
   git branch -M main
   git push -u origin main
   ```
3. In GitHub, go to **Settings > Pages**.
4. Under **Branch**, select `main` and root `/`, then click **Save**.
5. Your website is live at `https://<your-username>.github.io/cu-lost-and-found/`!

### Option 2: Vercel (Free)
- **Via Vercel CLI**:
  ```bash
  npx vercel
  ```
- **Via Vercel Web Dashboard**:
  - Connect your GitHub repo or drag-and-drop the project folder at [vercel.com/new](https://vercel.com/new). The included `vercel.json` will automatically configure routing and security headers.

### Option 3: Netlify (Free)
- **Via Drag-and-Drop**:
  - Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the project folder directly into your browser.
- The included `netlify.toml` handles caching and security headers out of the box.

### Option 4: Local Preview
You can run it locally with any lightweight HTTP server or open `index.html` directly in any web browser:
```bash
# Python 3
python -m http.server 8080

# Or Node.js
npx serve .
```
Then visit `http://localhost:8080`.

---

## 📁 Project Structure

```text
cu-lost-and-found-portal/
├── index.html          # Semantic, accessible master HTML5 document
├── css/
│   └── styles.css      # Custom university design system (responsive, dark/light, print)
├── js/
│   ├── data.js         # Canonical campus locations, categories, and 20+ realistic seed items
│   └── app.js          # Reactive controller, search engine, modals, claims, and storage
├── vercel.json         # Vercel deployment configuration
├── netlify.toml        # Netlify deployment configuration
└── README.md           # Documentation & deployment guide
```

---

## 🏛️ Campus Custody Desks Reference

- **Central Security Command Post**: Gate 1, Main Campus Checkpoint (24/7) | Ext 401
- **Central Library Helpdesk**: Ground Floor Circulation Counter | Ext 310
- **Department of Student Welfare (DSW)**: Academic Block C1 Ground Floor | `dsw.lostfound@cumail.in`
- **Transport Hub Desk**: Gate 3 Bus Terminal Counter | Ext 208

---

&copy; 2026 Chandigarh University. Official Campus Student Services Portal.
