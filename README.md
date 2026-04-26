# ◈ Porter – Premium Package Delivery App

A full-stack delivery management web application with real-time tracking, dual dashboards (User + Admin), and modern animated UI.

---

## ✨ Features

### User Side
- 🔐 Sign up / Login (JWT auth)
- 📦 Multi-step order creation (package → pickup → dropoff → review)
- 📍 GPS-based location detection
- 🗓 Scheduled pickup with date/time picker
- 📡 **Live real-time tracking** via WebSocket (Socket.IO)
- 🔔 Instant push notifications for status changes
- 📋 Order history with filtering
- 🌙 Light / Dark mode

### Admin Side
- 📊 Dashboard with live stats (total, active, delivered, users)
- 🚨 Real-time new order alerts
- 🔄 Update order status (instantly pushed to user)
- 📍 Push live GPS location updates to tracking page
- ⏸ **Stop/Hold delivery mid-transit** with reason
- ✏️ Edit order data (driver, price, notes, description)
- 👥 Full order table with search + filter

---

## 🛠 Tech Stack

| Layer     | Technology            |
|-----------|-----------------------|
| Frontend  | React 18, React Router v6 |
| Backend   | Node.js, Express.js   |
| Database  | MongoDB + Mongoose    |
| Realtime  | Socket.IO             |
| Auth      | JWT + bcryptjs        |
| Styling   | Pure CSS-in-JS with CSS variables |
| Fonts     | Syne (display) + DM Sans (body) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16
- MongoDB (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/porter-delivery-app.git
cd porter-delivery-app
```

### 2. Setup Backend
```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
npm install
npm run dev
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```

App runs at: `http://localhost:3000`  
API runs at: `http://localhost:5000`

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/porter-db
JWT_SECRET=your_super_secret_jwt_key
ADMIN_CODE=PORTER_ADMIN_2024
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## 👤 Creating an Admin Account

During registration, enter the **Admin Code** (`PORTER_ADMIN_2024` by default) to get admin access.  
Change `ADMIN_CODE` in your `.env` for production.

---

## 📁 Project Structure

```
porter-delivery-app/
├── backend/
│   ├── models/
│   │   ├── User.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── orders.js
│   │   ├── admin.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── ThemeContext.js
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   ├── pages/
│   │   │   ├── AuthPage.js
│   │   │   ├── UserDashboard.js
│   │   │   ├── NewOrder.js
│   │   │   ├── TrackOrder.js
│   │   │   ├── OrderHistory.js
│   │   │   ├── AdminDashboard.js
│   │   │   └── AdminOrderDetail.js
│   │   ├── components/
│   │   │   └── Navbar.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Orders (User)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Create order |
| GET | `/api/orders` | Get my orders |
| GET | `/api/orders/:id` | Get order detail |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/orders` | All orders |
| GET | `/api/admin/stats` | Dashboard stats |
| PUT | `/api/admin/orders/:id/status` | Update status |
| PUT | `/api/admin/orders/:id/location` | Push live location |
| PUT | `/api/admin/orders/:id` | Edit order |
| GET | `/api/admin/users` | All users |

---

## 🎨 Design System

- **Accent**: `#ff5c1a` (Porter Orange)
- **Success**: `#1db87e`
- **Font Display**: Syne (Google Fonts)
- **Font Body**: DM Sans (Google Fonts)
- Full CSS variable theming — easy to customize

---

## 📄 License

MIT
