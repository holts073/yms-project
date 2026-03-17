# ILG Foodgroup - Supply Chain / Yard Management System

A robust, full-stack application designed to streamline and manage the entire supply chain workflow, handling container and ex-works deliveries. It provides a real-time dashboard, detailed statistics, automated status tracking, document management, and automated Mail Transport Orders.

## Architectural Changes & Overview

The system has recently been migrated to a more robust, state-of-the-art architecture:
- **SQLite Database:** The application now utilizes a highly concurrent relational database (`better-sqlite3`), allowing for ACID-compliant transactions, scaling, and the ability to persist millions of rows efficiently.
- **Server-Side Pagination:** The React frontend now interfaces directly with a REST API (`/api/deliveries`) equipped with efficient pagination and querying.
- **Persistent Filters & Sortering:** Delivery filtering and sorting parameters are dynamically synced with the browser's URL, enabling users to refresh the page, share links, or navigate History without losing context.
- **SMTP Password Reset:** The login portal features a newly added automated password-reset flow powered by dynamic `nodemailer` configurations set by the system admin.
- **Micro-Animations & Modern UI:** A sleek, glass-morphic interface leveraging `motion/react` with customized animations out-of-the-box.

## Readiness for a Yard Management System (YMS)
Due to the recent transition to an established relational database structure (SQLite), the application is now primed for easy integration of additional operational modules—specifically, a **Yard Management System (YMS)**. 

With data normalized into structured `deliveries`, `users`, and `documents` tables, future components can freely query and attach properties such as:
- Dock assignments
- Real-time vehicle check-in / check-out timestamps
- Carrier metrics
- Gate management logic

All these capabilities seamlessly append to the existing relational model without bottlenecking the application state.

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Database**
   The application intercepts startup and automatically handles the creation of `database.sqlite` based on the defined schema. 
   *(Note: Any existing data within `database.json` will be gracefully parsed and migrated into SQLite across the `src/db/migrate.ts` script!)*

3. **Development Server**
   Start both the Vite frontend server and Express/Socket backend simultaneously.
   ```bash
   npm run dev
   ```

4. **Production Build**
   To deploy, compile the frontend application:
   ```bash
   npm run build
   ```
   Then run the server:
   ```bash
   npm start
   ```

## Features

- **Dashboard:** At-a-glance oversight over deliveries needing action today, delayed containers, and missing paperwork.
- **Statistics:** Granular insights over Lead Times, On-Time In-Full (OTIF) execution, Type ratios, and Cost/Volume ratios based on suppliers. 
- **Delivery Management:** View, sort, export to CSV, edit, and track delivery history in a modal format.
- **Supplier & Forwarder Contacts:** Built-in address book supporting rich text, OTIF statistics, and conditional remarks.
- **Automated Communication:** One-click automated E-mail generation (Mail Transport Order) utilizing configurable Mailserver Settings (SMTP) accessible efficiently via the Admin settings panel.

## License
Proprietary software - ILG Foodgroup. All rights reserved.
