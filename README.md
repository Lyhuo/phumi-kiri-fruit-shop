# ហាងលក់ផ្លែឈើស្រស់ ភូមិគិរី — Firebase edition

React + TypeScript + Vite fruit shop management using Firebase Authentication and Cloud Firestore.

## Features
- Khmer / English, USD / KHR
- Fruit catalog, kg / box pricing, descriptions and low-stock alerts
- Stock-in, stock-out and stock movement history
- Sales transaction automatically reduces stock
- Expenses, weekly / monthly / yearly reports and CSV export
- Email/password authentication; each user's records are isolated

## 1. Create Firebase project
1. Open https://console.firebase.google.com/ and create a project.
2. Add a Web app (</>) and copy its Firebase configuration.
3. Authentication → Sign-in method → enable Email/Password.
4. Firestore Database → Create database.
5. Firestore → Rules: paste `firestore.rules` and Publish.

## 2. Environment variables
Create `.env` from `.env.example` and fill all six values from Firebase Project settings → Your apps → SDK setup and configuration.

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Firebase web config is used by the browser app; security depends on Firebase Authentication and Firestore Rules. Never put a service-account private key in frontend variables.

## 3. Deploy with GitHub + Vercel
Import `Lyhuo/phumi-kiri-fruit-shop` in Vercel. Use Vite, build command `npm run build`, output `dist`. Add all six `VITE_FIREBASE_*` variables to Production and Preview, then deploy. In Firebase Authentication settings, add your Vercel domain to Authorized domains.

## Data layout
`users/{uid}/products`, `users/{uid}/sales`, `users/{uid}/expenses`, `users/{uid}/stock_movements`. Stock changes and sales are committed with Firestore transactions.
