# Ordexa Backend API 🚀

Ordexa is a multi-tenant social-commerce order management platform tailored for clothing and fashion sellers in Bangladesh. It bridges the gap between Facebook Messenger conversations, structured order taking, courier delivery, and inventory management.

## 🏗️ Architecture

The system is decoupled into two separate environments to ensure high performance and serverless scalability:
*   **API Layer (Vercel):** Handles HTTP requests, authentication, webhooks, and database mutations.
*   **Background Worker (Fly.io):** A dedicated BullMQ worker that handles asynchronous tasks (Messenger notifications, PDF invoice generation, automated courier bookings).

### Tech Stack
*   **Core:** Node.js, Express.js, TypeScript
*   **Database:** PostgreSQL (Hosted on Neon), Prisma ORM
*   **Caching & Queue:** Redis (Cloud Hosted), BullMQ
*   **Storage:** Cloudinary (Product Images)
*   **Integrations:** SSLCommerz (Payments), Meta Graph API (Messenger Bot), Steadfast (Courier), FraudBD (Fraud Checker)
*   **Deployment:** Vercel (API), Fly.io (Workers)

## 🚀 Local Development Setup

### 1. Prerequisites
*   Node.js (v20+)
*   npm or pnpm
*   PostgreSQL (Neon) Database URL
*   Redis Database URL

### 2. Installation
```bash
git clone https://github.com/IGNIT3-xD/Ordexa/tree/main/backend
cd backend
npm install
```  

### 3. Environment Variables
```  
cp .env.example .env
``` 

### 4. Database Migration
Generate the Prisma client and push the schema to your Neon database:
```
npx prisma generate
npx prisma migrate dev --name init
```  

### 5. Run the Application
Start the API server:
```
npm run dev
```
In a separate terminal, start the background workers:
```
npm run start:worker
```

## 🌍 Deployment
### API (Vercel)
The API is deployed as a serverless function on Vercel.

- Connect your GitHub repo to Vercel.

- Set the Framework Preset to Other.

- Add all .env variables to the Vercel dashboard.

### Workers (Fly.io)
The workers run in a Docker container on Fly.io.

```
fly launch
fly secrets set NODE_ENV="production" DATABASE_URL="..." REDIS_HOST="..." etc.
fly deploy
```

## 🔐 Security Features
- Multi-Tenancy: Every query is strictly scoped using a businessId verified via the resolveBusiness middleware.

- Hashed Tokens: Public form links are hashed at rest (SHA-256) to prevent database leaks.

- Encrypted Secrets: Courier and Facebook Page tokens are AES-256-GCM encrypted before hitting the database.

- Rate Limiting: Strict limits on login and public form submissions.

- Fraud Checking: Integrated with FraudBD to prevent COD (Cash on Delivery) losses.