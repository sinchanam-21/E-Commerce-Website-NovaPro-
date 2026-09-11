# E-Commerce Hardware Store

A high-density, full-stack e-commerce web application featuring a hardware catalog, multi-view product inspector, real-time cart state management, checkout simulation, order ledger tracking, and cancellation with automated inventory restocking.

---

## Features

### 1. Product Catalog & Matrix
- **Data-Dense Layout**: Compact layout designed with high-contrast status strips, live telemetry (SKU count, warehouse dispatch ETA, weight index), and category tags.
- **Dynamic Search & Filtering**: Instant search across titles, specifications, and categories with live inventory counters.
- **Stock Indicators**: Real-time stock status badge and quantity badges.

### 2. Product Inspector (Detail View)
- **Interactive Multi-Angle Gallery**: High-resolution image view with thumbnail selectors.
- **Technical Specifications Grid**: Detailed spec parameters (Processor, Interface, Storage, Power, Dimensions).
- **Direct Actions**:
  - **Add to Cart**: Configurable quantities with stock limit prevention.
  - **Buy Now**: Single-click fast-track routing straight to the checkout pipeline.
- **Interactive Customer Reviews**: Customer rating distribution, review submission form, and community feedback list.

### 3. Cart & Promo Engine
- **Slide-out Cart Drawer**: Non-intrusive cart inspection with increment/decrement stepper and individual removal.
- **Coupon System**:
  - `SAVE10` — 10% off items subtotal
  - `HARDWARE20` — 20% off items subtotal
  - `TECH15` — 15% off items subtotal
- **Free Shipping Threshold**: Automated computation for free standard delivery on qualifying subtotal orders ($50+).

### 4. Checkout & Order Placement
- **Consignee Shipping Form**: Address inputs with one-click **"Fill Demo Address"** helper.
- **Freight & Delivery Selection**: Standard Freight vs. Express Air Cargo.
- **Payment Protocol Simulation**: Cash on Delivery (COD) or Simulated Digital Card.
- **Order Manifest Summary**: Real-time tax (7%), freight, and discount price ledger breakdown.

### 5. Order Ledger & Cancellation
- **Order Confirmation**: Manifest summary, transaction confirmation, and simulated dispatch status.
- **Order Cancellation**:
  - Available directly on the confirmation screen or via the **Order Ledger History** modal.
  - Interactive cancellation modal with reason selection.
  - **Automatic Catalog Restock**: Restores reserved item quantities back to the warehouse product stock upon cancellation.
- **Order History Audit**: Past order receipts tracking items, totals, delivery status, and voided/restocked notes.

### 6. Currency Switching (USD $ & INR ₹)
- **Instant Currency Switcher**: Toggle button seamlessly accessible in the navigation bar (both desktop and mobile views).
- **Dynamic Conversion**: Converts all prices across catalog, product inspector, cart drawer, checkout ledger, orders history, filter ranges, and delivery thresholds in real time.
- **Persistent Preference**: Selected currency is saved in browser storage for consistent browsing.

### 7. Store Owner Product Management (Admin-Only & Secure)
- **Restricted Access**: Dedicated to the verified store owner (`oreooreooreo9@gmail.com`). Access is authenticated on both the client (UI controls hidden for non-owners) and strictly enforced on the server-side via `authenticateAdmin` middleware.
- **Add Product SKU (`POST /api/products`)**:
  - Modal with real-time validation: Name, category, pricing, initial stock count, image URLs, description, and technical specs (Key/Value pairs).
  - Automatically generates unique SKU code and sets stock counts.
- **Remove Product SKU (`DELETE /api/products/:id`)**:
  - Secure deletion trigger available on product cards and the product detail view.
  - Confirmation modal requiring explicit SKU name match confirmation to prevent accidental removals.
- **Owner Quick-Fill**: One-click quick authentication button in the sign-in modal for `oreooreooreo9@gmail.com`.

### 8. User Authentication
- Simulated JWT/Token account management with demo account prefill (`john@example.com`) and Store Owner account (`oreooreooreo9@gmail.com`).
- Toggle between Sign In and Account Registration.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React icons, Motion, Canvas-Confetti
- **Backend**: Node.js, Express (REST API)
- **Database Layer**: In-memory document collection with full MongoDB/Firestore collection semantics
- **Build Tooling**: Vite, esbuild, tsx

---

## Project Structure

```text
├── index.html                  # HTML entry point with metadata tags
├── server.ts                   # Express server and REST API endpoints
├── server/
│   └── db.ts                   # Document store, schemas, seed products & orders
├── src/
│   ├── main.tsx                # Client application root
│   ├── App.tsx                 # Core state container, routing, and notifications
│   ├── types.ts                # Shared TypeScript definitions and data interfaces
│   ├── index.css               # Global Tailwind CSS entry
│   └── components/
│       ├── Navbar.tsx          # High-density navigation bar & status strip
│       ├── FiltersBar.tsx      # Category selector, search bar, and stock metrics
│       ├── ProductCard.tsx     # Compact hardware item card
│       ├── ProductDetail.tsx   # Detailed specification inspector & Buy Now flow
│       ├── CartDrawer.tsx      # Slide-out shopping cart & promo input
│       ├── CheckoutPage.tsx    # Address, freight selector, & order commitment
│       ├── OrderConfirmation.tsx# Post-checkout receipt & cancellation trigger
│       ├── OrderHistoryModal.tsx# Account order history & cancellation management
│       ├── AuthModal.tsx       # User login and registration modal
│       └── Toast.tsx           # Transient system notifications
├── package.json
└── README.md
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | Retrieve all products (supports `?category=`, `?search=`, `?inStock=`) |
| `POST` | `/api/products` | **Owner Only (`oreooreooreo9@gmail.com`)**: Create a new product SKU |
| `DELETE` | `/api/products/:id` | **Owner Only (`oreooreooreo9@gmail.com`)**: Delete a product SKU from catalog |
| `GET` | `/api/products/:id` | Retrieve single product details |
| `POST` | `/api/products/:id/reviews` | Post a customer review for a product |
| `POST` | `/api/orders` | Commit a new order and decrement inventory stock |
| `GET` | `/api/orders` | Retrieve orders for current user or session |
| `POST` | `/api/orders/:id/cancel` | Cancel an order and return item units to inventory |
| `POST` | `/api/auth/login` | Authenticate user credentials |
| `POST` | `/api/auth/register` | Register a new user profile |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Development Server
Starts the Express server with Vite middleware on port 3000:
```bash
npm run dev
```

### 3. Production Build
Builds the client bundle and compiles `server.ts` with `esbuild`:
```bash
npm run build
npm start
```
