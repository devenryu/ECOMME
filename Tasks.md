# MVP Overview

This project is a **simple e-commerce landing page generator** for individual product sales. Sellers can create multiple **standalone product pages**, each with a "Buy Now" button leading to a universal order form. Products are not listed together in a catalog—they each live on their own unique link, allowing sellers to advertise and sell them individually.

### Key Features:
- Sellers can create and manage multiple independent products.
- Each product has its own landing page with a chosen template.
- Buyers fill out a standard form to place an order.
- Sellers manage orders and update statuses via a dashboard.
Always use pnpm
---

Always use pnpm

## Development environment

-ubuntu 24.04
Always use pnpm
---

## Tech Stack

### Frontend:
- **Next.js (App Router)** — React framework for routing and rendering
- **Tailwind CSS** — Utility-first styling
- **Radix UI** — Accessible UI primitives
- **Lucide Icons** — Modern icon set
- **React Hook Form** + **Zod** — Form management and validation
- **next-themes** — Light/Dark theme support

### Backend:
- **Next.js API Routes** — Server-side logic and APIs
- **JWT Auth (with HttpOnly cookies)** — Seller login and protected routes
- **Supabase** — PostgreSQL Database, Auth, and optional file storage

### Dev & Ops:
- **TypeScript** — Strong typing for maintainability
- **ESLint & Prettier** — Code quality and formatting
- **Docker** — Local development & potential deployment
- **Vercel** — For simple and fast frontend deployments

---

# Tasks

| Story Points | Task                                                                 | Role                                     |
|--------------|----------------------------------------------------------------------|------------------------------------------|
| 1     [x]    | Create basic frontend scaffold (Next.js + Tailwind)                  | Frontend foundation                      |
| 2     [x]    | Create basic backend scaffold (Express + JWT auth)                   | Backend foundation                       |
| 3     [x]    | Define database schema for Product and Order                         | Data modeling                            |
| 4     [x]    | Implement database migrations                                        | Data persistence                         |
| 5     [x]    | Build Seller login page with form validation                         | Authentication                           |
| 6     [x]    | Implement login API endpoint with JWT                                | Authentication                           |
| 7     [x]    | Protect dashboard routes with auth middleware                        | Security                                 |
| 8     [x]    | Build Dashboard layout with nav links (Products, Orders)             | UI structure                             |
| 9     [x]    | Create "Products" list component in dashboard                        | Product management UI                    |
| 11    [x]    | Implement `GET /api/products` endpoint                               | Product API                              |
| 12    [x]    | Fetch and display products in dashboard                              | Product management data                  |
| 13    [x]    | Create "Create Product" button and modal form                        | Product creation UI                      |
| 14    [x]    | Implement `POST /api/products` to save new product                   | Product API                              |
| 15    [x]    | Generate unique slug/ID for each product                             | Data modeling                            |
| 16    [x]    | Build TemplateSelector component with 3 template previews            | Product creation UI                      |
| 17    [x]    | Wire template choice into product creation flow                      | Product creation logic                   |
| 18    [x]    | Implement product activate/deactivate toggle                         | Product management                       |
| 19    [x]    | Create dynamic public route `/p/[slug]`                              | Routing                                  |
| 20    [x]    | Fetch product data in public page (`GET /api/products/:slug/public`) | Public product rendering                 |
| 21    [x]    | Build three React template components for product page               | UI components                            |
| 22    [x]    | Add "Buy Now" button linking to `/p/[slug]/order`                    | Buyer flow                               |
| 23    [x]    | Build Order form component with fields and validation                | Buyer flow form                          |
| 24    [x]    | Implement `POST /api/orders` to save order                           | Order API                                |
| 25    [x]    | Show order confirmation page                                         | Buyer feedback                           |
| 26    [x]    | Create "Orders" list in dashboard per product                        | Order management UI                      |
| 27    [x]    | Implement `GET /api/orders?productId=` endpoint                      | Order API                                |
| 28    [x]    | Display orders table with status and "View Details" button           | Order management data                    |
| 29    [x]    | Build OrderDetail component showing full form data                   | Order management UI                      |
| 30    [x]    | Implement `PUT /api/orders/:id/status` to update order status        | Order API                                |
| 31    [x]    | Add status dropdown in OrderDetail and wire status update            | Order management interaction             |
| 32    [x]    | Configure Tailwind theme (colors, typography)                        | Styling                                  |
| 33    [x]    | Write README with setup, env vars, run instructions                  | Documentation                            |
| 34    [x]    | Write database migration and seed scripts                            | Deployment prep   