# AGENTS.md

## Project

Auditly is a full-stack AI social media content audit tool.

The app lets a user submit a public X/Twitter profile and email address. It fetches real public posts, calculates deterministic audit metrics, runs Gemini AI classification and synthesis, saves the report in PostgreSQL, and renders a persistent `/report/[id]` page.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma
- Neon PostgreSQL
- Google Gemini via `@google/genai`
- Apify for X/Twitter public post fetching
- Vercel deployment

## Commands

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Generate Prisma client:

```bash
npx prisma generate
```

Run local migrations:

```bash
npx prisma migrate dev
```

Run production migration deploy:

```bash
npx prisma migrate deploy
```

Build:

```bash
npm run build
```

Vercel build:

```bash
npm run vercel-build
```

## Architecture Rules

- Use Next.js App Router.
- Keep server-only code inside `src/lib` and API routes.
- Do not expose secrets to client components.
- Do not call Gemini or Apify from client components.
- Use API routes/server functions for database, provider, and AI work.
- Keep provider logic separate from audit logic.
- The audit pipeline must stay multi-step:
  1. Resolve profile URL.
  2. Fetch public posts.
  3. Normalize posts.
  4. Calculate deterministic metrics.
  5. Classify posts with Gemini.
  6. Generate final report with Gemini.
  7. Save report snapshot.
  8. Render saved `/report/[id]`.

## Data Flow

- `rawPosts`: real provider data from Apify.
- `normalizedData`: cleaned internal post format.
- `metrics`: deterministic TypeScript-calculated metrics.
- `classifications`: Gemini post-level classification output.
- `finalReport`: Gemini final synthesis shown in the UI.

Do not replace this with a single prompt that generates everything directly from raw posts.

## Code Style

- Prefer small focused modules.
- Prefer typed inputs and outputs.
- Use Zod for runtime validation where data crosses boundaries.
- Avoid `any`; use `unknown` and narrow safely.
- Keep UI components reusable.
- Use dark Auditly styling consistently.
- Use existing component structure before creating new folders.

## Database Rules

- Use Prisma for all database access.
- Do not manually edit generated Prisma client files.
- Commit Prisma migration files.
- Do not commit `.env`.
- Store report snapshots instead of regenerating on every `/report/[id]` visit.

## Environment Variables

Required:

```env
DATABASE_URL=""
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash-lite"
APIFY_TOKEN=""
APIFY_X_ACTOR_ID="scraper_one/x-profile-posts-scraper"
APIFY_POST_LIMIT="5"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Git Workflow

Use clean feature branches.

Recommended branch pattern:

```txt
feat/*
fix/*
docs/*
chore/*
```

Commit only after a working checkpoint.

Use clear commit messages, for example:

```txt
feat: add social provider architecture
feat: add deterministic audit metrics
feat: add gemini audit agent
docs: add readme and deployment notes
```

## Important Constraints

- Do not fake LinkedIn analysis.
- LinkedIn should remain unsupported/coming soon unless a real provider is added.
- Do not hardcode report scores or recommendations.
- Static UI labels are allowed, but report content must come from saved report data.
- Be careful with Apify rate limits.
- Prefer production-safe, recruiter-demo-ready solutions over quick hacks.
