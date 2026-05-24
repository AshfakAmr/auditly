# Auditly — AI Social Media Content Audit Tool

Auditly is a full-stack AI-powered web application that analyzes public X/Twitter profiles and generates a structured content performance audit.

Users submit a public profile URL/handle and email address. The system fetches recent public posts, calculates deterministic content metrics, runs AI classification with Gemini, and returns a persistent scored report URL.

---

## Live Demo

Production URL:

https://auditly-three.vercel.app/

Example report URL format:

```txt
/report/[id]
```

---

## Project Overview

Auditly is designed as an AI content strategist for social media creators.

Most social media platforms show raw analytics such as likes, comments, reposts, and views. Auditly goes one step further by explaining:

- what is working
- what is weak
- why certain posts perform better
- what content patterns are visible
- what the creator should improve next

The goal is not to build another analytics dashboard. The goal is to generate a useful AI-powered content strategy report from real public post data.

---

## Problem Statement

Creators often know what happened to their posts, but they do not always know why it happened or what to do next.

Raw analytics answer:

```txt
What happened?
```

Auditly answers:

```txt
Why did it happen, what pattern is visible, and what should the creator improve next?
```

---

## Features

- Public X/Twitter profile audit
- Email capture before report generation
- Real public post fetching through a provider layer
- Provider fallback support for better reliability
- Original-post filtering to exclude replies and retweets
- Persistent report URL using `/report/[id]`
- Database-backed report storage
- Deterministic content metrics
- Gemini-powered AI classification
- Final AI-generated scored report
- Scored report cards instead of long text
- Loading/progress screen for the audit workflow
- Clean error states
- Vercel deployment-ready setup

---

## Tech Stack

| Layer                | Technology         |
| -------------------- | ------------------ |
| Framework            | Next.js App Router |
| Language             | TypeScript         |
| Styling              | Tailwind CSS       |
| UI Components        | shadcn/ui          |
| Database             | Neon PostgreSQL    |
| ORM                  | Prisma             |
| AI Provider          | Google Gemini      |
| Social Data Provider | Apify              |
| Deployment           | Vercel             |

---

## Why This Stack

### Next.js App Router

Next.js is used as the full-stack framework. It handles:

- landing page
- report page
- API routes
- server-side database access
- server-side AI calls
- deployment on Vercel

This avoids the need for a separate backend server for the MVP.

### TypeScript

TypeScript is used for type safety across the project, especially for API validation, social provider types, normalized post types, deterministic audit metrics, AI response validation, and report page view models.

### Prisma + Neon PostgreSQL

Prisma is used for type-safe database access and migrations. Neon PostgreSQL is used as the production database because it works well with serverless deployments and Vercel.

### Gemini API

Gemini is used for language-based AI reasoning tasks such as hook quality classification, topic focus analysis, content intent classification, and final recommendation synthesis.

### Apify Provider Layer

Apify is used to fetch real public X/Twitter post data.

The app uses a provider-based architecture so the audit pipeline does not depend directly on one scraping provider.

Current provider setup:

```txt
Primary provider: igolaizola/x-twitter-scraper-ppe
Fallback provider: scraper_one/x-profile-posts-scraper
```

The primary provider is used to fetch recent original posts. The fallback provider is used when the primary provider fails or is rate-limited.

The provider layer normalizes different actor outputs into one internal `RawPost` format before the audit pipeline starts.

---

## Architecture

Auditly uses a full-stack Next.js App Router architecture.

```txt
User submits profile + email
        ↓
POST /api/reports
        ↓
Resolve profile URL / handle
        ↓
Upsert Lead
        ↓
Check recent completed report cache
        ↓
Fetch public posts through provider layer
        ↓
Filter out replies and retweets
        ↓
Normalize posts
        ↓
Calculate deterministic metrics
        ↓
Run Gemini classification
        ↓
Generate final AI report
        ↓
Save report in PostgreSQL
        ↓
Redirect to /report/[id]
```

---

## Social Provider Flow

Auditly supports a provider fallback strategy for X/Twitter post fetching.

Current order:

```txt
1. igolaizola/x-twitter-scraper-ppe
2. scraper_one/x-profile-posts-scraper
```

The app attempts to fetch up to the configured post limit from the primary provider. If the primary provider fails, returns no usable posts, or hits provider limits, the app falls back to the secondary provider.

The fetched posts are then:

1. mapped into the common `RawPost` shape
2. filtered for usable original posts
3. deduplicated by post ID or URL
4. sorted by latest publish date
5. passed into the audit pipeline

The app accepts both handle and full URL formats:

```txt
@sama
sama
https://x.com/sama
https://twitter.com/sama
```

Internally, the input is resolved into:

```txt
profileHandle = sama
profileUrl = https://x.com/sama
```

The primary provider uses the handle, while the fallback provider can use the full profile URL.

---

## Original Post Filtering

Auditly is focused on auditing a creator’s own content strategy.

The provider layer is configured to prioritize original posts and exclude noisy content types.

Included:

- original posts
- normal timeline posts

Excluded:

- replies
- retweets/reposts

Quote posts may be excluded depending on provider configuration because they can mix original content with reshared content. This keeps the MVP report focused on the creator’s own direct publishing behavior.

---

## Multi-Step AI Agent Pipeline

Auditly is not a single-prompt AI wrapper.

The audit workflow is split into multiple controlled steps:

1. Resolve the submitted profile URL or handle.
2. Fetch real public posts from the configured provider.
3. Normalize provider-specific post data into a shared internal format.
4. Calculate deterministic metrics in TypeScript.
5. Classify posts with Gemini.
6. Analyze hook quality and topic focus.
7. Generate the final scored report with Gemini.
8. Save raw posts, normalized data, metrics, classifications, and final report JSON in PostgreSQL.
9. Render the saved report from `/report/[id]`.

Some steps are normal TypeScript functions. Some steps use Gemini.

This makes the system more reliable because factual metrics are calculated in code, while AI is used for reasoning and strategy.

---

## Deterministic Metrics

Before calling Gemini, the app calculates measurable signals in TypeScript:

- number of posts analyzed
- date range
- posts per week
- average posting gap
- longest inactive gap
- content format distribution
- total engagement
- average engagement
- best-performing post
- weakest-performing post
- engagement pattern preview

This prevents the AI from guessing facts that can be calculated directly.

---

## AI-Generated Analysis

Gemini is used for reasoning-heavy analysis:

- hook quality scoring
- hook reasoning
- topic classification
- content intent classification
- topic focus scoring
- final strategy recommendations

The final report includes:

- Overall Score
- Posting Consistency
- Content Mix
- Hook Quality
- Topic Focus
- Engagement Patterns
- Actionable Recommendations

---

## Database Design

The app uses two main models.

### Lead

Stores captured email addresses.

```txt
Lead
- id
- email
- createdAt
- updatedAt
```

### Report

Stores every generated report snapshot.

```txt
Report
- id
- leadId
- profileUrl
- platform
- profileHandle
- status
- providerUsed
- rawPosts
- normalizedData
- metrics
- classifications
- finalReport
- latestPostId
- latestPostDate
- postsAnalyzedCount
- errorMessage
- createdAt
- updatedAt
```

Each report is a saved snapshot. Revisiting `/report/[id]` loads the saved report from the database instead of regenerating it.

---

## Report Reuse Logic

Auditly includes cache-first report reuse to reduce provider usage and AI cost.

If the same X/Twitter profile has already been analyzed within the configured cache window, the app returns the existing completed report without calling Apify or Gemini again.

Default cache window:

```txt
24 hours
```

If the cache window has expired, the app can fetch posts again. If the latest post matches an already completed report, the app can reuse the old report and skip Gemini generation.

This avoids unnecessary provider calls and AI calls.

---

## Folder Structure

```txt
src/
  app/
    page.tsx
    report/
      [id]/
        page.tsx
    api/
      reports/
        route.ts
        [id]/
          route.ts

  components/
    landing/
    report/
    ui/

  lib/
    ai/
    audit/
    db/
    social/
      providers/

prisma/
  schema.prisma
```

---

## Environment Variables

Create a `.env` file for local development:

```env
DATABASE_URL="your_neon_postgres_url"

GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.5-flash-lite"

APIFY_TOKEN="your_apify_token"
APIFY_POST_LIMIT="20"

APIFY_X_IGOLAIZOLA_ACTOR_ID="igolaizola/x-twitter-scraper-ppe"
APIFY_X_SCRAPERONE_ACTOR_ID="scraper_one/x-profile-posts-scraper"

REPORT_CACHE_WINDOW_HOURS="24"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For Vercel production:

```env
DATABASE_URL="your_neon_postgres_url"

GEMINI_API_KEY="your_gemini_api_key"
GEMINI_MODEL="gemini-2.5-flash-lite"

APIFY_TOKEN="your_apify_token"
APIFY_POST_LIMIT="20"

APIFY_X_IGOLAIZOLA_ACTOR_ID="igolaizola/x-twitter-scraper-ppe"
APIFY_X_SCRAPERONE_ACTOR_ID="scraper_one/x-profile-posts-scraper"

REPORT_CACHE_WINDOW_HOURS="24"

NEXT_PUBLIC_APP_URL="https://auditly-three.vercel.app"
```

Never commit `.env`. Only `.env.example` should be committed.

---

## Local Setup

Install dependencies:

```bash
npm install
```

Generate Prisma client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start development server:

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Production Deployment

The app is deployed on Vercel.

Production URL:

https://auditly-three.vercel.app/

Production branch:

```txt
main
```

Build command:

```bash
npm run vercel-build
```

The `vercel-build` script runs:

```bash
npx prisma generate && npx prisma migrate deploy && next build
```

This ensures Prisma Client is generated and pending production migrations are applied before building the Next.js app.

---

## CI/CD

The project uses Vercel Git integration.

```txt
Feature branch → Pull Request → Preview deployment
Merge to main → Production deployment
```

Every merged update to `main` automatically triggers a new production deployment.

---

## Current MVP Scope

The MVP supports:

- X/Twitter profile analysis
- real public post fetching
- provider fallback for X/Twitter posts
- original-post filtering
- email capture
- persistent report URLs
- database-backed reports
- deterministic metrics
- Gemini-generated final report
- scored report UI
- loading and error states
- Vercel deployment

---

## Known Limitations

- The MVP fully supports X/Twitter first.
- LinkedIn is shown as unsupported/coming soon because public LinkedIn data access is restricted.
- The app depends on third-party Apify actors for public X/Twitter post fetching.
- Provider pricing, result limits, and rate limits can change depending on the actor and Apify account.
- If a provider fails or is rate-limited, the app falls back to the secondary provider when possible.
- Demo analysis may use fewer posts if provider limits restrict available results.
- The current system does not include login or a report-history dashboard.
- Reports are saved as snapshots and are not automatically refreshed in the background.
- Same-profile submissions within the cache window return the saved completed report.

---

## Future Improvements

- Add more fallback social data providers
- Add official X API support if budget allows
- Add report history dashboard
- Add authenticated user accounts
- Add email delivery for report links
- Add PDF export
- Add deeper topic clustering
- Add scheduled re-audits
- Add a manual “force refresh” option
- Add LinkedIn provider when a reliable compliant data source is available
- Add team/workspace support
- Add paid usage limits or credits

---

## Recruiter Explanation

Auditly is a production-style AI full-stack MVP.

It demonstrates:

- full-stack Next.js development
- database modeling
- provider-based architecture
- real public data fetching
- fallback provider handling
- deterministic analytics
- Gemini AI integration
- multi-step agent workflow
- persistent report URLs
- clean UI/UX
- deployment with CI/CD

The AI agent is not a single prompt wrapper.

It combines:

- tools/functions
- state
- real provider data
- deterministic calculations
- AI classification
- AI synthesis
- database persistence
- shareable report URLs

The final report UI is generated from saved `finalReport` JSON, but that `finalReport` is created only after prior pipeline steps: post fetching, normalization, deterministic metrics, and AI classification.
