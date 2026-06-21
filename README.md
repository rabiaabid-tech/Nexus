# Business Nexus Platform

Business Nexus is a secure, real-time collaboration platform designed to connect investors and entrepreneurs. It features an encrypted messaging system, real-time notifications, and role-based dashboards to facilitate professional networking.

## 🚀 Live Demo

- **Frontend:** [https://nexus-plateform-taupe.vercel.app](https://nexus-plateform-taupe.vercel.app)
- **Backend API:** [https://nexus-bsiu.onrender.com](https://nexus-bsiu.onrender.com)

## 🛠 Tech Stack

- **Frontend:** React.js, Tailwind CSS, Lucide-React, React Router DOM, Socket.io-client
- **Backend:** Node.js, Express.js, Socket.io
- **Database:** PostgreSQL (via NeonDB)
- **Security:** AES-256 Encryption (crypto module), JWT Authentication, CORS protection

## ✨ Key Features

- **Encrypted Communication** — Private messages are stored in the database using AES-256 encryption, ensuring data privacy and security.
- **Real-time Notifications** — Instant system alerts delivered via Socket.io for a responsive user experience.
- **Role-Based Access** — Specialized dashboards for Investors and Entrepreneurs.
- **Secure Authentication** — JWT-based session management.
- **Responsive UI** — Optimized dashboard interfaces with consistent design principles.
- **Meeting Scheduling** — Comprehensive engine for requesting and confirming pitch   meetings.
- **Document Chamber (E-Signature)** — Digital signing module using HTML5 Canvas for legal verification.

## 🏗 Architecture & Flow

## ⚙️ Installation & Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/rabiaabid-tech/Nexus
cd Nexus
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder with the following:

```env
DATABASE_URL=your_neon_db_url
JWT_SECRET=your_secret
ENCRYPTION_KEY=your_32_char_key
```

Start the backend server:

```bash
node server.js
```

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` folder with the following:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend dev server:

```bash
npm run dev
```