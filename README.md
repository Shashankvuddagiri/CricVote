# MML IPL Predictions 🏏💎

Welcome to **MML IPL Predictions**, a high-performance, real-time cricket prediction platform built for the 2026 IPL season. This application is powered by **Appwrite Cloud** and features a fully serverless architecture with automated match syncing and automated points distribution.

---

## 🚀 The Architecture: "Arena Intelligence"
This project is built to be 100% serverless and maintenance-free:
1.  **Frontend**: React + Vite + Tailwind CSS (Glassmorphic Theme).
2.  **Database**: Appwrite Databases with real-time subscriptions for live leaderboard updates.
3.  **Auth**: Appwrite OAuth2 (Google) with mandatory username onboarding.
4.  **Backend (Serverless)**: 
    - `syncIPLMatches`: Daily automated CRON job to fetch real IPL fixtures from CricAPI.
    - `processPoints`: Real-time trigger that settles points automatically when a winner is set.

---

## 📦 Project Structure
- **/frontend**: React Application source code.
- **/appwrite-functions**: Production-ready source code for Appwrite Cloud Functions.
- **/public**: Assets including the official MML IPL Logo and favicons.

---

## ⚙️ Setup & Installation

### 1. Frontend
```bash
cd frontend
npm install
npm run dev
```
Make sure to create a `.env` file in the `frontend` folder with your Appwrite Project ID and Collection IDs.

### 2. Deployment
Detailed steps for Vercel and Appwrite Cloud can be found in our **[Deployment Guide](./deployment_guide.md)**.

---

## 🔒 Security Policy
- **DO NOT** commit your `.env` or `appwrite_function.env` files to version control.
- Ensure all Collections in Appwrite have the correct **Document-Level Permissions** (Read for Any, Create/Update for Users).

---

## 🛠️ Admin Controls
The Arena includes a built-in **Admin Control Panel** accessible only by the authorized email (`vshashank2005@gmail.com`). From here, you can:
- **Manually Add Matches** (If the API lags).
- **Edit Records** (Change scores, venues, or logos).
- **Go Live** & **Settle Winners** with one click.

---

### 🏆 May the Best Warrior Win!
Built with ❤️ by Antigravity for the 2026 IPL Season.
