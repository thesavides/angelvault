# AngelVault v2 - Angel Investment Marketplace

A production-ready two-sided marketplace connecting pre-seed startups ($25k-$200k) with qualified angel investors. Built with Go, PostgreSQL, and designed for Google Cloud Run deployment.

## 🎯 Key Features

### For Investors
- **Pay-to-View Model**: $500 unlocks 4 project deep-dives
- **Two-Tier NDA System**: Master NDA + per-project addendums
- **Project Filtering**: By category, investment range, and search
- **Offer Management**: Submit offers, track status, sign term sheets
- **OAuth Login**: Google, LinkedIn, Apple authentication

### For Founders (Developers)
- **Project Submission**: Comprehensive project profiles with team, financials, pitch deck
- **Admin Vetting**: All projects reviewed before listing
- **NDA Customization**: Add project-specific confidentiality terms
- **Offer Management**: Accept/reject offers, execute SAFE notes

### Platform Features
- **Dynamic Categories**: Admin-managed, with project counts
- **Public Stats**: Category breakdowns visible to all visitors
- **Stripe Integration**: Secure payment processing
- **PostgreSQL**: Production-ready database with migrations
- **Cloud Run Ready**: Dockerized with health checks

## 🏗 Architecture

```
angelvault-v2/
├── cmd/server/           # Application entry point
├── internal/
│   ├── config/           # Environment configuration
│   ├── database/         # PostgreSQL connection & migrations
│   ├── handlers/         # HTTP request handlers
│   ├── middleware/       # Auth, CORS, rate limiting
│   ├── models/           # GORM models
│   ├── routes/           # API route definitions
│   └── services/         # Business logic
├── web/                  # Frontend assets
├── migrations/           # SQL migrations
├── deploy/               # Cloud Run configuration
├── Dockerfile
└── .env.example
```

## 🚀 Quick Start

### Prerequisites
- Go 1.22+
- PostgreSQL 15+
- Stripe account (for payments)
- OAuth credentials (Google, LinkedIn, Apple)

### Local Development

1. **Clone and setup environment**
```bash
cp .env.example .env
# Edit .env with your credentials
```

2. **Start PostgreSQL**
```bash
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=angelvault \
  -p 5432:5432 \
  postgres:15
```

3. **Run the server**
```bash
go run ./cmd/server
```

4. **Access the application**
```
http://localhost:8080
```

### API Endpoints

#### Public
```
GET  /api/public/stats          # Platform stats with category counts
GET  /api/public/categories     # List categories
GET  /api/projects              # List approved projects (public view)
GET  /api/projects/:id          # Get project details
```

#### Authentication
```
POST /api/auth/register         # Register with email
POST /api/auth/login            # Login with email
GET  /api/auth/google           # Get Google OAuth URL
GET  /api/auth/linkedin         # Get LinkedIn OAuth URL
GET  /api/auth/apple            # Get Apple OAuth URL
```

#### Investor
```
GET  /api/investor/payments/status      # Check credit balance
POST /api/investor/payments/create-intent  # Start Stripe payment
POST /api/investor/projects/:id/unlock  # Unlock project (uses credit)
GET  /api/investor/nda/status           # Master NDA status
POST /api/investor/nda/sign             # Sign master NDA
GET  /api/investor/nda/project/:id/status  # Project addendum status
POST /api/investor/nda/project/:id/sign    # Sign project addendum
```

#### Developer
```
GET  /api/developer/projects            # My projects
POST /api/developer/projects            # Create project
PUT  /api/developer/projects/:id        # Update project
POST /api/developer/projects/:id/submit # Submit for review
```

## 🔒 NDA Workflow

The platform implements a two-tier NDA system:

1. **Master Platform NDA** (signed once)
   - Covers general platform confidentiality
   - Valid for 2 years
   - Required before viewing any project

2. **Project-Specific Addendum** (signed per project)
   - References master NDA
   - Contains project-specific IP clauses
   - Founders can add custom terms
   - Creates legal link between investor and project

## 💳 Payment Flow

1. Investor clicks "Buy Credits"
2. Frontend creates PaymentIntent via `/api/investor/payments/create-intent`
3. Stripe Elements collects card details
4. Payment confirmed via `/api/investor/payments/confirm`
5. Credits added (4 project views for $500)
6. Investor can unlock projects

## 🎨 Brand Guidelines

- **Primary Colors**: Turquoise (#40E0D0) → Teal (#008080) gradient
- **Accent**: Bright Teal (#00CED1), Gold (#FFB800)
- **Background**: Deep Navy (#1A2332)
- **Typography**: Sora (display), Inter (body)

## 🚢 Deployment

### Google Cloud Run

1. **Build and push image**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/angelvault
```

2. **Create secrets**
```bash
gcloud secrets create angelvault-secrets --data-file=.env.production
```

3. **Deploy**
```bash
gcloud run deploy angelvault \
  --image gcr.io/PROJECT_ID/angelvault \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Cloud SQL Setup

```bash
gcloud sql instances create angelvault-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create angelvault \
  --instance=angelvault-db
```

## 📊 Data Models

### User
- Supports email + OAuth (Google, LinkedIn, Apple)
- Roles: investor, developer, admin
- Investor profiles with accreditation status

### Project
- Two-tier visibility (public vs unlocked)
- Team members, images, documents
- Investment terms (min/max, equity, valuation cap)
- Status workflow: draft → pending → approved → funded

### Payment
- Stripe integration with webhook support
- Credit tracking (4 views per $500)
- Payment history and receipts

### NDA
- Master NDA with signature capture
- Project addendums with custom terms
- Document hashing for integrity

## 🔧 Environment Variables

See `.env.example` for all configuration options including:
- Database connection
- JWT secret
- OAuth credentials
- Stripe keys
- Email (SMTP) settings
- Cloud storage (GCS)

## 📝 License

Proprietary - Ukuva Consulting

---

Built with ❤️ by [Ukuva Consulting](https://ukuva.co)

