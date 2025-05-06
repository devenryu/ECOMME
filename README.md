# Supabase CLI (v1)

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for our CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Pushing your local changes to production
- [x] Create and Deploy Supabase Functions
- [ ] Manage your Supabase Account
- [x] Manage your Supabase Projects
- [x] Generating types directly from your database schema
- [ ] Generating API and validation schemas from your database

## Getting started

### Install the CLI

#### macOS

Available via [Homebrew](https://brew.sh). To install:

```sh
brew install supabase/tap/supabase
```

To upgrade:

```sh
brew upgrade supabase
```

#### Windows

Available via [Scoop](https://scoop.sh). To install:

```powershell
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

To upgrade:

```powershell
scoop update supabase
```

#### Linux

Available via [Homebrew](https://brew.sh) and Linux packages.

##### via Homebrew

To install:

```sh
brew install supabase/tap/supabase
```

To upgrade:

```sh
brew upgrade supabase
```

##### via Linux packages

Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm` file depending on your package manager and run `sudo apk add --allow-untrusted <...>.apk`/`sudo dpkg -i <...>.deb`/`sudo rpm -i <...>.rpm` respectively.

### Run the CLI

```sh
supabase help
```

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

The CLI is a WIP and we're still exploring the design, so expect a lot of breaking changes. We try to document migration steps in [Releases](https://github.com/supabase/cli/releases). Please file an issue if these steps don't work!

## Developing

To run from source:

```sh
# Go >= 1.18
go run . help
```

---

## Sponsors

[![New Sponsor](https://user-images.githubusercontent.com/10214025/90518111-e74bbb00-e198-11ea-8f88-c9e3c1aa4b5b.png)](https://github.com/sponsors/supabase)

# E-commerce Landing Page Generator

A simple e-commerce landing page generator for individual product sales. Sellers can create multiple standalone product pages, each with a "Buy Now" button leading to a universal order form.

## Features

- Create and manage multiple independent products
- Choose from three beautiful templates (Minimal, Standard, Premium)
- Secure seller authentication
- Order management dashboard
- Real-time status updates
- Responsive design
- Dark mode support

## Tech Stack

### Frontend
- **Next.js (App Router)** — React framework for routing and rendering
- **Tailwind CSS** — Utility-first styling
- **Radix UI** — Accessible UI primitives
- **Lucide Icons** — Modern icon set
- **React Hook Form** + **Zod** — Form management and validation
- **next-themes** — Light/Dark theme support

### Backend
- **Next.js API Routes** — Server-side logic and APIs
- **JWT Auth (with HttpOnly cookies)** — Seller login and protected routes
- **Supabase** — PostgreSQL Database, Auth, and optional file storage

### Dev & Ops
- **TypeScript** — Strong typing for maintainability
- **ESLint & Prettier** — Code quality and formatting
- **Docker** — Local development & potential deployment
- **Vercel** — For simple and fast frontend deployments

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Docker (optional)
- Supabase account

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ecome.git
cd ecome
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up the database:
```bash
pnpm supabase:migrate
```

4. Start the development server:
```bash
pnpm dev
```

The app should now be running at [http://localhost:3000](http://localhost:3000).

### Database Setup

1. Create a new Supabase project
2. Copy the environment variables from your project settings
3. Run the migrations:
```bash
pnpm supabase:migrate
```

## Development

### Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm type-check` - Run TypeScript type checking

### Project Structure

```
src/
  ├── app/              # Next.js App Router pages
  ├── components/       # React components
  │   ├── ui/          # Reusable UI components
  │   ├── products/    # Product-related components
  │   └── orders/      # Order-related components
  ├── lib/             # Utilities and helpers
  │   └── validations/ # Zod schemas
  └── types/           # TypeScript types
```

## Deployment

### Vercel

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add the environment variables
4. Deploy

### Docker

1. Build the image:
```bash
docker build -t ecome .
```

2. Run the container:
```bash
docker run -p 3000:3000 ecome
```

## License

MIT License - see [LICENSE](LICENSE) for details
