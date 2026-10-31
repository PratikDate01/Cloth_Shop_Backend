# AURA ATELIER - Fashion E-Commerce Backend API

Production-grade Node.js & Express REST API for **AURA ATELIER** fashion & apparel e-commerce platform.

---

## 🌟 Architecture & Features

- **Authentication & Security**:
  - JWT Authentication with Bearer tokens & HTTP-only cookies.
  - Role-based authorization (`admin`, `customer`).
  - Brute-force & credential stuffing defense with dedicated rate limiting.
  - Helmet HTTP security headers, CORS origin whitelisting, and reverse proxy trust (`app.set('trust proxy', 1)`).
- **Product & Inventory Engine**:
  - Multi-variant apparel catalog (Size, Color, Hex Code, SKU, Variant Pricing).
  - Atomic stock deductions and inventory transactions history.
  - Full-text search and faceted filtering (Category, Subcategory, Price, Rating, In-Stock).
- **Cart & Order Processing**:
  - Persistent guest cart and automatic cart merging upon customer login.
  - Dynamic coupon engine (Percentage & Flat discounts) with validation rules.
  - Razorpay live payment gateway integration with webhook signature verification.
- **Admin Management**:
  - Revenue analytics, sales overview, order fulfillment status tracker.
  - Customer status management and audit logs.
  - Cloudinary integration for direct cloud image uploads with local fallback.
- **Production Hardening**:
  - Pre-flight environment variable validation (`config/envValidator.js`).
  - Graceful shutdown handling (`SIGTERM`, `SIGINT`) closing HTTP and MongoDB connections.
  - Mongoose connection pooling and lifecycle monitoring.
  - Comprehensive health check diagnostic endpoint (`/api/health`).
  - PM2 cluster mode configuration (`ecosystem.config.js`).
  - Containerized with multi-stage non-root Docker (`Dockerfile`).

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js 4
- **Database**: MongoDB & Mongoose ORM
- **Payment Gateway**: Razorpay
- **Cloud Media**: Cloudinary
- **Emails**: Nodemailer (SMTP / Gmail / SendGrid)
- **Security**: Helmet, Express Rate Limit, BCrypt.js, JSONWebToken

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update the required variables:
- `MONGODB_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: Random 32+ character secret string.
- `CLIENT_URL`: Frontend URL (e.g. `http://localhost:5173` or production domain).
- `RAZORPAY_KEY_ID` & `RAZORPAY_KEY_SECRET`: Razorpay credentials.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: Media upload credentials.

### 3. Run Integration Tests
```bash
npm test
```

### 4. Start Server
- Development mode (with auto-reload):
  ```bash
  npm run dev
  ```
- Production mode:
  ```bash
  npm start
  ```

---

## 🐳 Docker Deployment

Build and run the container:
```bash
docker build -t aura-backend .
docker run -p 5000:5000 --env-file .env aura-backend
```

---

## 📡 API Health Check

Automated diagnostic endpoint:
```bash
GET /api/health
```
Returns 200 with connection state and memory usage:
```json
{
  "status": "healthy",
  "service": "Cloth Shop Fashion E-Commerce API",
  "uptimeSeconds": 360,
  "environment": "production",
  "database": {
    "connected": true,
    "state": "connected"
  },
  "memoryUsageMB": 64,
  "timestamp": "2026-10-31T23:30:00.000Z"
}
```

---

## 📄 License

ISC License. Developed by CodeOrbit Solutions.
