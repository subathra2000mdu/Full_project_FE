# ✈️ Flight Booking and Reservation System

A full-stack MERN application for searching, booking, and managing flight reservations across India — with secure payment processing, PDF receipts, email confirmations, and an admin analytics dashboard.

---

## 📸 Screenshots

| Page | Description |
|------|-------------|
| 🏠 Home / Search | Search flights by route, date, passengers & class |
| 📋 Booking Form | Fill passenger details and seat preference |
| 💳 Payment Page | Card / UPI / Bank transfer with booking summary |
| 📜 History Page | View all bookings, cancel, download receipts |
| 📊 Analytics | Reports on revenue, routes, status breakdown |
| 🔐 Register / Login | User authentication and account management |

---

## 🚀 Features

### ✈️ Flight Search & Booking
- Search flights by **departure IATA code**, **arrival IATA code**, **date**, **number of passengers** (1–9), and **booking class** (Economy / Business / First Class)
- Compare flight prices across multiple airlines (Air India, SpiceJet, IndiGo, Vistara, etc.)
- View real-time seat availability and flight status (Scheduled / Active / Delayed / Cancelled)
- Book flights with passenger name, email, and seat preference (Window / Aisle / Middle)

### 💳 Payment Processing
- **Three payment methods:** Credit/Debit Card, UPI, Bank Transfer
- Card form with auto-formatting (16-digit number, MM/YY expiry, masked CVV)
- UPI validation (format: `username@bankname`)
- Bank transfer with IFSC code validation
- Booking summary panel shown alongside payment form
- **PDF receipt auto-downloaded** immediately after successful payment
- **Booking confirmation email sent** instantly on payment

### 📜 Booking Management (History Page)
- View all bookings with reference number, passenger name, email, airline, route, date, and status
- Status badges: **Paid** (green) / **Cancelled** (red) / **Pending** (amber)
- **Cancel booking** directly from the history page (Paid bookings only)
- **Download PDF receipt** for any booking
- **Activity Logs tab** — shows all user actions (Created, Booked, Cancelled, Updated) with timestamps

### 📊 Analytics Dashboard
- **6 stat cards:** Total Bookings, Revenue, Confirmed, Cancelled, Pending, Cancellation Rate
- **Bookings per Day** — 7-day bar chart
- **Booking Status** — progress bar breakdown (Paid / Cancelled / Pending)
- **Popular Routes** — top 5 most booked routes with frequency bars
- **Bookings by Airline** — airline-wise booking distribution
- **Activity Log Summary** — action type breakdown
- **Revenue banner** with average booking value and sparkline

### 🔐 User Accounts
- Register with full name, email, and password
- Login / Logout with JWT token authentication
- Logged-in user's name shown in the navbar
- Protected routes redirect unauthenticated users to login

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React.js | UI framework |
| React Router DOM | Client-side routing |
| Tailwind CSS | Styling and responsive design |
| Axios | HTTP requests with JWT interceptor |
| Lucide React | Icons |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime |
| Express.js | REST API framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication tokens |
| Nodemailer | Email confirmation on payment |
| PDFKit / pdfmake | PDF receipt generation |
| bcryptjs | Password hashing |

---

## 📁 Project Structure

```
Flight-Booking-System/
├── frontend/
│   ├── src/
│   │   ├── API/
│   │   │   └── axiosInstance.js        # Axios with base URL + JWT header
│   │   ├── Pages/
│   │   │   ├── HomePage.jsx            # Search + flight listing + cancel
│   │   │   ├── BookingPage.jsx         # Passenger details + seat selection
│   │   │   ├── PaymentPage.jsx         # Card / UPI / Bank payment flow
│   │   │   ├── AdminHistory.jsx        # Booking history + activity logs
│   │   │   ├── AnalyticsDashboard.jsx  # Reports and charts
│   │   │   ├── LoginPage.jsx           # User login
│   │   │   └── RegisterPage.jsx        # User registration
│   │   ├── Components/
│   │   │   └── Header.jsx              # Navbar with auth state
│   │   └── App.jsx                     # Routes definition
│   └── package.json
│
└── backend/
    ├── routes/
    │   ├── auth.js                     # Register, Login
    │   ├── flights.js                  # Search flights
    │   ├── bookings.js                 # Reserve, history, cancel, download PDF
    │   ├── payments.js                 # Create intent, confirm payment
    │   └── admin.js                    # Admin history, dashboard stats
    ├── models/
    │   ├── User.js
    │   ├── Flight.js
    │   ├── Booking.js
    │   └── ActivityLog.js
    ├── middleware/
    │   └── auth.js                     # JWT verify middleware
    ├── utils/
    │   ├── sendEmail.js                # Nodemailer email sender
    │   └── generatePDF.js             # PDF receipt generator
    └── server.js
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/your-username/flight-booking-system.git
cd flight-booking-system
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` folder:

```env
PORT=3001
MONGO_URI=mongodb://localhost:27017/flightbooking
JWT_SECRET=your_jwt_secret_key_here

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
EMAIL_FROM=your_email@gmail.com
```

Start the backend server:

```bash
npm start
# or for development with auto-reload:
npm run dev
```

Backend runs on: `http://localhost:3001`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` folder (if using Vite):

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🔗 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT token |

### Flights
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/flights/search` | Search flights (`?from=MAA&to=BOM&date=&passengers=1&bookingClass=Economy`) |

### Bookings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings/reserve` | Create a new booking |
| GET | `/api/bookings/my-history` | Get user's booking history |
| PATCH | `/api/bookings/update/:id` | Update booking (cancel) |
| GET | `/api/bookings/download/:id` | Download PDF receipt |
| DELETE | `/api/bookings/delete/:id` | Delete a booking |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-intent` | Create payment intent |
| POST | `/api/payments/confirm` | Confirm payment + send email |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/history` | Get all activity logs |
| GET | `/api/admin/dashboard` | Get dashboard stats (cancellation rate etc.) |

---

## 🧭 App Routes (Frontend)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | HomePage | Flight search and results |
| `/login` | LoginPage | User login |
| `/register` | RegisterPage | User registration |
| `/booking/:flightId` | BookingPage | Passenger details form |
| `/payment/:bookingId` | PaymentPage | Payment form |
| `/history` | AdminHistory | Booking history + activity logs |
| `/analytics` | AnalyticsDashboard | Reports and charts |

---

## 💡 How to Use

1. **Register / Login** — Create an account or log in
2. **Search Flights** — Enter IATA codes (e.g. `MAA` → `BOM`), select date, passengers, and class
3. **Book a Flight** — Click "Book Now →", fill in passenger name, email, and seat preference
4. **Pay** — Choose Card / UPI / Bank, complete the payment
5. **Get Confirmation** — Email sent automatically + PDF receipt downloaded instantly
6. **Manage Bookings** — Go to History to view all bookings, cancel a booking, or re-download receipt
7. **View Analytics** — Go to Analytics for booking trends, revenue, and route statistics

---

## 🔒 Authentication Flow

1. User registers → password hashed with `bcryptjs` → stored in MongoDB
2. User logs in → server verifies password → returns JWT token
3. Frontend stores token in `localStorage` as `userToken`
4. All protected API calls send `Authorization: Bearer <token>` header via Axios interceptor
5. Backend middleware verifies token on every protected route

---

## 📧 Email & PDF Flow

After successful payment:
1. Backend updates booking `paymentStatus` to `Completed`
2. **Nodemailer** sends a booking confirmation email to the passenger's email address with flight details, booking reference, and total amount
3. **PDF receipt** is generated server-side and returned as a blob
4. Frontend auto-downloads the PDF as `booking-receipt-<id>.pdf`

---

## 🧪 Test Credentials

**Test Card (for payment testing):**
```
Card Number : 4242 4242 4242 4242
Expiry Date : Any future date (e.g., 12/27)
CVV         : Any 3-digit number (e.g., 123)
```

**Sample IATA Codes:**
| City | Code |
|------|------|
| Chennai | MAA |
| Mumbai | BOM |
| Delhi | DEL |
| Bangalore | BLR |
| Hyderabad | HYD |
| Kolkata | CCU |
| Ahmedabad | AMD |
| Kochi | COK |

---
