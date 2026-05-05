# 🏭 EPFBD WMS v8 — Warehouse Management System

> **Dark Mode · Firebase Sync · Full CRUD · Multi-Factory**

A premium, fully offline-capable Warehouse Management System for **EPFBD** (EPF · TGL · BGL · GTM · RFL · EC factories).

---

## 🚀 Live Demo

> Open `index.html` in any modern browser — no server needed.  
> Or deploy to **GitHub Pages** for online access.

---

## 📁 Project Structure

```
EPFBD_WMS_v8/
├── index.html              # 🏠 Dashboard
├── wms-theme.css           # 🎨 Dark Design System
├── firebase-db.js          # 🔥 Firebase sync layer
├── firebase-setup.html     # ⚙️ Firebase configuration
│
├── manpower/
│   ├── all_manpower.html   # 👥 All staff (264 records)
│   ├── EPF_manpower.html   # EPF factory staff
│   ├── TGL_manpower.html   # TGL factory staff
│   ├── BGL_manpower.html   # BGL factory staff
│   ├── GTM_manpower.html   # GTM factory staff
│   ├── RFL_manpower.html   # RFL factory staff
│   └── EC_manpower.html    # EC factory staff
│
├── warehouse/
│   ├── wh_list.html        # 🏭 Warehouse list (27 locations)
│   ├── mis_login.html      # 🔑 MIS Login (PIN protected)
│   └── mail_list.html      # 📧 Email directory
│
├── equipment/
│   ├── pda_devices.html    # 📱 PDA & Scanners
│   ├── barcode_printer.html# 🖨 Barcode Printers (CP-2140EX)
│   ├── forklift.html       # 🚜 Forklift management
│   └── maintenance_log.html# 🔧 Maintenance & Fuel log
│
├── kpi/
│   └── staff_kpi.html      # ⭐ KPI Dashboard
│
└── hr/
    └── attendance.html     # 📋 Leave · Absent · Warning · Late
```

---

## ✨ Features

| Module | Description |
|--------|-------------|
| 🏠 **Dashboard** | KPI overview, factory status, analytics charts |
| 👥 **Manpower** | 264 staff records across 6 factories |
| 🏭 **Warehouse** | 27 locations with full CRUD |
| 📱 **Equipment** | PDA, Barcode Printers, Forklifts |
| 🔧 **Maintenance** | 1,613 spare parts + fuel logs |
| ⭐ **KPI Dashboard** | Staff performance tracking |
| 📋 **HR Module** | Leave (CL/SL/EL/NP), Absent, Warning, Late — with ranking |
| 🌙 **Dark Mode** | Pure black background, white font throughout |
| 🔥 **Firebase** | Optional real-time cloud sync |

---

## 🛠️ Setup

### Option 1 — Local (Offline)
```bash
# Just open in browser
open index.html
```

### Option 2 — GitHub Pages (Online)
1. Fork or upload this repo
2. Go to **Settings → Pages**
3. Source: `main` branch → `/ (root)`
4. Your site: `https://yourusername.github.io/epfbd-wms/`

### Option 3 — Firebase Sync (Optional)
1. Open `firebase-setup.html`
2. Enter your Firebase project credentials
3. All data syncs in real-time across devices

---

## 🎨 Design System

- **Background:** `#0a0a0a` (Pure Black)
- **Surface:** `#141414`
- **Text:** `#f0f0f0` (White)
- **Accent:** `#3ecf8e` (Green)
- **Font:** DM Sans + Plus Jakarta Sans

---

## 📊 Data Summary

| Category | Count |
|----------|-------|
| Total Staff | 264 |
| Warehouses | 27 |
| Equipment Units | 68 |
| Maintenance Records | 1,613 |
| Barcode Printers | 5 |

---

## 🏭 Factories

| Code | Name | Staff |
|------|------|-------|
| EPF | Evergreen Packaging Factory | 145 |
| TGL | Tippu Garments Ltd | 70 |
| BGL | — | 4 |
| GTM | — | 3 |
| RFL | — | — |
| EC | — | — |

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| v8.1 | May 2026 | Full Dark Mode, HR Module, Barcode Printer page |
| v8.0 | May 2026 | New premium SaaS design, Firebase sync |
| v7.x | 2025 | Previous versions |

---

*Built with ❤️ for EPFBD Warehouse Team*
