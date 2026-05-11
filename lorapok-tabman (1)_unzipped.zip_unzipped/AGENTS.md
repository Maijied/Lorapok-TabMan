# Project: Lorapok Tabman

## 📡 Overview
Lorapok Tabman is a specialized productivity tool for Firefox users, combining a browser extension with a centralized React-based dashboard. It targets power users who struggle with "tab fatigue" and system resource exhaustion.

## 🎨 Design System
- **Company**: Lorapok Labs
- **Primary Palette**: 
  - Background: Navy `#030711`
  - Accent: Sky Blue `#38bdf8`
  - Text: Slate `#94a3b8`
- **Aesthetic**: Brutalist-Modern. High-contrast, sharp borders, bold typography (Space Grotesk/Inter), and fluid animations (Framer Motion).

## 🧩 Architectural Blueprint
### 1. The Extension (Manifest V3)
- **Location**: `/public/extension`
- **Strategy**: Captures the state of all open tabs in the current window.
- **Data Flow**: Serializes tab metadata (ID, URL, Title, Favicon) into a `tabGroup` object and persists it to `browser.storage.local`.

### 2. The Dashboard (React 19)
- **Location**: `/src/pages/Dashboard.tsx`
- **State Management**: Reactive hooks that listen for storage changes.
- **Dual-Storage Engine**:
  - **Local**: Uses `chrome.storage.local` or `localStorage` for semi-anonymous use.
  - **Firebase**: Uses Firestore for authenticated cloud sync.

### 3. Backend (Firebase)
- **Authentication**: Google OAuth popup.
- **Database**: Firestore.
- **Security**: Strict ABAC (Attribute-Based Access Control) defined in `firestore.rules`. Users can only read/write their own `userId` paths.

## 🛠 Project Structure Detail
- `/public/extension/manifest.json`: Defines permissions (`tabs`, `storage`, `host_permissions`).
- `/src/lib/firebase.ts`: Singleton for Firebase initialization and error handling.
- `/src/lib/storage.ts`: Unified API for switching between local and cloud storage.
- `/src/types.ts`: Shared interfaces for `TabGroup` and `TabItem`.

## 📝 Roadmap & Constraints
- **Roadmap**: Implement category tagging for tab groups, auto-archiving of old sessions, and memory usage analytics.
- **Constraint**: The extension must remain lightweight—avoiding heavy dependencies in `background.js`.
