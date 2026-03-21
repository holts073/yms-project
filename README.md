# ILG Foodgroup - Supply Chain & Yard Management System (YMS)

A comprehensive, full-stack logistics platform designed to manage the entire supply chain workflow—from inbound container and ex-works deliveries to real-time yard operations and dock scheduling.

## 🚀 Recent Expansion: Yard Management System (YMS)
The system now includes a state-of-the-art **YMS Module**, enabling warehouse managers to orchestrate yard traffic with precision:

- **Real-time Dock Scheduling:** Interactive Timeline and List views for managing dock occupancy across multiple warehouses.
- **Inbound & Outbound Support:** Seamlessly switch between **INBOUND** (unloading) and **OUTBOUND** (loading) flows with dynamic UI status updates.
- **Fast-Lane Logic:** Efficiently handle small shipments (≤ 10 pallets) with specialized **Fast-Lane Docks** (⚡) and automated late-registration exemptions.
- **Waiting Area Management:** Full CRUD control over yard parking spots, including status toggles for **Active**, **Deactivated**, and **Blocked** (Maintenance) states.
- **AI-Driven Optimization:** Built-in AI logic for predictive scheduling, ETA adjustments, and priority-based dock assignment.
- **Reefer & Temperature Workflow:** Dedicated monitoring for temperature-controlled trailers with specialized priority rules and long-wait alerts.
- **Compliance Reporting:** Automated tracking of non-compliant arrivals (late or unannounced) to identify and address supplier/carrier performance issues.

## 📦 Core Logistics Features

- **Delivery Dashboard:** At-a-glance oversight of daily actions, delayed containers, and pending documentation.
- **Advanced Statistics:** Granular insights into Lead Times, On-Time In-Full (OTIF) execution, cost/volume ratios, and supplier performance.
- **Address Book:** Integrated contact management for Suppliers and Transporters, featuring OTIF tracking and rich-text remarks.
- **Automated Communication:** One-click generation of Mail Transport Orders (MTO) via a configurable SMTP engine.
- **Document Management:** Centralized repository for delivery-related paperwork with automated status tracking.

## 🛠️ Technical Stack

- **Frontend:** React 19, Vite, Tailwind CSS (Vanilla CSS focus), Lucide Icons, Framer Motion (for high-end micro-animations).
- **Backend:** Node.js, Express, Socket.io (for real-time dashboard syncing).
- **Database:** SQLite (`better-sqlite3`) for robust, ACID-compliant relational data management.
- **Mailing:** Nodemailer with dynamic admin-defined SMTP configurations.
- **Language:** TypeScript for end-to-end type safety.

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- NPM

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Initialization**
   The application automatically handles the creation of `database.sqlite` and applies necessary migrations on startup based on the `src/db/sqlite.ts` schema.

3. **Development Mode**
   Starts the combined Express/Socket.io backend and the Vite frontend:
   ```bash
   npm run dev
   ```

4. **Production Build**
   Build the frontend:
   ```bash
   npm run build
   ```
   Start the server in production:
   ```bash
   npm start
   ```

## 🔐 Security & Access
- **Authentication:** Robust login system with password hashing (`bcryptjs`).
- **Access Recovery:** Managed via the `restore-access.ts` utility and automated password-reset flows.

## 📄 License
Proprietary software - ILG Foodgroup. All rights reserved.
