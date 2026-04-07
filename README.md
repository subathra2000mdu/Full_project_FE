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


# Razorpay Setup Guide
# Complete steps: account → API keys → install → env vars → deploy

## STEP 1 — Create Razorpay Account (Free)
1. Go to https://dashboard.razorpay.com/signup
2. Enter your name, email, password → click "Create account"
3. Verify your email
4. You are now in TEST MODE by default (no KYC needed for test mode)

## STEP 2 — Get Test API Keys
1. Log into https://dashboard.razorpay.com
2. Make sure you are in TEST MODE (toggle at top of dashboard)
3. Go to:  Settings → API Keys → Generate Key
4. A popup shows your KEY ID and KEY SECRET
5. DOWNLOAD or COPY both — the secret is shown only ONCE
   - Key ID looks like:      rzp_test_XXXXXXXXXXXXXXXX
   - Key Secret looks like:  XXXXXXXXXXXXXXXXXXXXXXXX

## STEP 3 — Install Razorpay in VS Code (Backend)
Open your backend folder in VS Code terminal and run:

   cd Final_project_BE
   npm install razorpay

Verify it installed:
   cat package.json | grep razorpay
   # should show: "razorpay": "^2.x.x"

## STEP 4 — Add to .env file (Local Development)

Add these to your backend .env file:
   RAZORPAY_KEY_ID     = rzp_test_XXXXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET = XXXXXXXXXXXXXXXXXXXXXXXX

Your full .env should look like:
   MONGODB_URI        = mongodb+srv://...
   PORT               = 3001
   JWT_SECRET         = mysupersecretkey
   EMAIL_USER         = subathra2000mdu@gmail.com
   EMAIL_PASS         = mvpcuzanryuoljrc
   CANCELLATION_RATE  = 50
   NODE_ENV           = production
   RAZORPAY_KEY_ID    = rzp_test_XXXXXXXXXXXXXXXX
   RAZORPAY_KEY_SECRET= XXXXXXXXXXXXXXXXXXXXXXXX

## STEP 5 — Add to Render Dashboard (Production)
1. Go to https://dashboard.render.com
2. Click your backend service
3. Go to: Environment → Environment Variables
4. Add:
   Key:   RAZORPAY_KEY_ID      Value: rzp_test_XXXXXXXXXXXXXXXX
   Key:   RAZORPAY_KEY_SECRET  Value: XXXXXXXXXXXXXXXXXXXXXXXX
5. Click "Save Changes" — Render auto-redeploys

## STEP 6 — Add to Netlify (Frontend — NOT needed)
Razorpay Key ID goes to frontend via the backend API response.
The backend sends keyId in the /payments/create-intent response.
Frontend reads it from there. No Netlify env var needed.

## STEP 7 — Files to Replace
Backend:
   controllers/paymentController.js  ← new Razorpay version
   controllers/bookingController.js  ← fixed autoTable + new Flight schema support

Frontend:
   src/Pages/PaymentPage.jsx         ← new Razorpay popup version

## TEST CARD NUMBERS (Test Mode)
   Card Number: 4111 1111 1111 1111
   Expiry:      Any future date (e.g. 12/27)
   CVV:         Any 3 digits (e.g. 123)
   Name:        Any name

   UPI Test ID: success@razorpay  (succeeds)
   UPI Test ID: failure@razorpay  (fails — to test error flow)

## HOW THE FLOW WORKS
1. User clicks "Book Now" → BookingPage saves booking with status "Pending"
2. User goes to PaymentPage → frontend calls POST /payments/create-intent
3. Backend creates Razorpay order → returns { orderId, keyId, amount }
4. Frontend opens Razorpay popup with orderId + keyId
5. User pays → Razorpay calls handler() with payment IDs + signature
6. Frontend sends IDs to POST /payments/confirm
7. Backend verifies signature with crypto.createHmac → marks booking "Completed"
8. Email sent to passenger → PDF downloaded → redirect to History

## GOING LIVE (When ready for real payments)
1. Complete Razorpay KYC at: dashboard.razorpay.com → Settings → Business Details
2. Switch to LIVE MODE on dashboard
3. Generate LIVE API keys (Settings → API Keys → Live Mode)
4. Replace rzp_test_... keys with rzp_live_... keys in Render env vars
5. No code changes needed — the same code works for both test and live