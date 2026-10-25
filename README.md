# RideNest - Car & Bike Rental Platform

Owners list their cars/bikes for short-term rent. Renters search, book a pickup/drop slot, and get a **digital rental agreement** that both sides e-sign. Built with **Node.js, Express.js and MongoDB**.

## Run it

Requirements: Node.js 18+.

```bash
npm install
```

**Option A - Quickstart with embedded database:** starts an embedded MongoDB instance, seeds initial vehicle listings and launches the server.

```bash
npm run dev:memory
```

**Option B - Using local MongoDB:** make sure `mongod` is active, then run:

```bash
npm run seed
npm start
```

Open http://localhost:3000

Demo credentials (password `Demo@1234`):
- Owners: `owner@demo.com`, `owner2@demo.com`, `owner3@demo.com`
- Renter: `renter@demo.com`

End-to-end API verification test: `node scripts/smoke-test.js`

## Workflow Demonstration

1. Log in as **renter**, select a vehicle, specify pickup/drop schedule (dynamic price quote calculates automatically), and confirm the booking.
2. The platform generates the **digital agreement** - enter full legal name to apply your digital signature.
3. Switch account to **owner@demo.com**, open *Bookings*, review the contract and countersign.
4. Execute **Hand over keys**, then **Mark returned**. Review the *Earnings* dashboard analytics.
5. Log back in as renter to submit a rating and review.

## Architecture & Technical Implementation

| Component | Focus Area | Technical Implementation |
|---|---|---|
| Node.js Core | Runtime & Package Ecosystem | CommonJS architecture, package dependency management, environment isolation via `dotenv`, modular design across `src/` |
| Express.js Framework | RESTful Routing & Middleware | Centralized request logger, secure cookie parsing, robust error handling, route modularization, dynamic route parameters (`router.param`), URL canonicalization and rewriting |
| Document Storage | MongoDB & Document Schemas | Schema validation, compound and text indexing (`users`, `vehicles`, `bookings`, `agreements`, `reviews`), persistent document stores |
| Scalability & High Availability | Distributed System Principles | Stateless JWT authentication for seamless horizontal scaling, replica-set resilience, optimized indexing strategies for concurrent lookups |
| Data Modeling | Schema Normalization & Snapshots | Immutable contract snapshots for signed agreements, embedded pricing details in bookings, referenced relationships for reviews and audit trails, SHA-256 agreement cryptographic hashing |
| Database Integration | Node.js Driver & Aggregations | Multi-stage aggregation pipelines (`$match`, `$group`, `$lookup`, `$facet`, `$project`) for analytics, bcrypt password hashing, role-based access control (RBAC) |

## Key Features

- Verified vehicle fleet across major cities with high-resolution imagery and specifications
- Role-based account system: **renter** and **owner** with JWT authentication in secure httpOnly cookies
- Owner portal: Add, edit, manage vehicle listings, track incoming bookings, and monitor revenue analytics
- Renter portal: Search with multi-attribute filtering (city, vehicle type, fuel, transmission, price range, calendar availability), instant booking, and reviews
- Transparent pricing model: Daily rates, hourly increments, service fee, and refundable security deposit calculation
- Concurrency & booking conflict prevention: Real-time overlap detection
- Tamper-proof digital agreements: Auto-generated legal agreements tied to a cryptographic SHA-256 fingerprint, mutual e-signatures, and downloadable JSON contracts

## Project Structure

```
server.js              Application entry point
src/app.js             Express application configuration & middleware pipeline
src/db.js              Database connection, client lifecycle & index definitions
src/routes/            Modular route handlers (auth, vehicles, bookings, agreements, stats, pages)
src/middleware/        Authentication, request logging, and centralized error handling
src/utils/             Cryptographic signing, validation, pricing calculations, file stores
views/                 Front-end presentation templates
public/                Client assets (stylesheets, icons, client scripts, vehicle media)
data/                  Initial seed configuration and generated agreement archives
scripts/               Seed utilities, in-memory development database, automated smoke tests
```

## System Architecture & Technical Design Decisions

- The API is **stateless** (auth lives in a signed token), so several Node instances can run behind a load balancer - the "scalability" and "transparency" goals of a distributed system.
- For reliability / fault tolerance run MongoDB as a **replica set**; for data growth shard `bookings` by `vehicleId`. Indexes are designed around the real query patterns.
- Booking creation uses an overlap check plus a post-insert conflict check because the standalone dev database has no multi-document transactions. On a replica set this could be wrapped in a transaction.
- **Eventual consistency trade-off:** `ownerName` is copied into each vehicle; if an owner renames themselves, old listings keep the old name until updated. Agreements deliberately keep snapshots so a signed contract never changes.

## API overview

| Method & path | Purpose | Access |
|---|---|---|
| POST `/api/auth/register`, `/login`, `/logout`; GET `/me` | Authentication | public |
| GET `/api/vehicles` (filters, sort, page) | Search | public |
| GET `/api/vehicles/:id`, `/:id/reviews` | Detail, reviews | public |
| POST/PUT/PATCH/DELETE `/api/vehicles[/:id]` | Manage listings | owner (own vehicles) |
| POST `/api/bookings/quote`, POST `/api/bookings` | Price quote, book | renter |
| GET `/api/bookings/mine`, `/incoming` | Trip lists | renter / owner |
| PATCH `/api/bookings/:id/status` | cancel / pickup / return | parties |
| GET `/api/agreements/:bookingId`, POST `/sign`, GET `/download` | Digital agreement | the two parties |
| GET `/api/stats/public`, `/owner` | Aggregations | public / owner |
