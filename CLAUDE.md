# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TopicForge is an AI-driven graduation design topic generation system built with Next.js 16 (App Router). It uses Markov chains and template-based algorithms to generate thesis topics from a dataset of 25,102 real graduation topics across 68 academic majors.

## Common Commands

### Development

```bash
npm run dev              # Start dev server with Turbopack
npm run build            # Production build (uses webpack for nodejieba compatibility)
npm run start            # Run production server
```

### Code Quality

```bash
npm run lint             # ESLint check
npm run lint:fix         # ESLint auto-fix
npm run format           # Prettier format all files
npm run type-check       # TypeScript type checking
```

### Testing

```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:unit        # Unit tests only (test/unit/)
npm run test:integration # Integration tests only (test/integration/)
npm run test:coverage    # Generate coverage report
```

### Database (Prisma)

```bash
npm run setup:db:dev     # Initialize SQLite dev database
npm run setup:db:prod    # Initialize MySQL prod database
npm run db:generate      # Generate Prisma client
npm run db:push          # Push schema changes
npm run db:migrate       # Create migration
npm run db:studio        # Open Prisma Studio GUI
```

### Data Management

```bash
npm run data:import      # Import sample seed data (1,000 topics)
npm run data:import:full # Import full dataset (25,102 topics)
npm run data:export      # Export database to JSON
npm run crawler          # Run web scraper for thesis data
npm run train            # Train Markov chain models
```

## Architecture

### Core Structure

```
src/
├── app/                 # Next.js App Router pages and API routes
│   ├── api/generate/    # Topic generation API endpoint
│   ├── api/topics/      # Topics listing API endpoint
│   ├── generate/        # Generation page
│   └── topics/          # Topics browse page
├── components/          # React components
│   ├── ui/              # Radix UI-based component library
│   └── layout/          # Layout components
└── lib/                 # Core business logic
    ├── services/        # Service layer (main logic)
    ├── interfaces/      # TypeScript interfaces
    ├── constants/       # Stop words, tech dictionaries
    └── db.ts            # Prisma client singleton
```

### Service Layer (`src/lib/services/`)

The service layer implements the topic generation algorithms:

- **topic-generator.service.ts** - Main orchestrator that coordinates generation
- **markov-chain.service.ts** - Markov chain algorithm (bi-gram/tri-gram)
- **template-generator.service.ts** - Template-based generation with placeholders
- **text-processor.service.ts** - Chinese NLP processing using nodejieba
- **major.service.ts** - Academic major/field management
- **data.service.ts** - Data persistence layer

Services are exported as singletons from `lib/services/index.ts`.

### Database Models (Prisma)

Key models in `prisma/schema.prisma`:

- **GraduationTopic** - Raw thesis topics with metadata
- **GenerationSession** - Complete generation results with statistics
- **GeneratedTopic** - User-generated topics with algorithm info
- **MarkovChain** - State transitions for text generation
- **MajorMarkovChain** - Field-specific Markov chains
- **Major** - University major/field information

Development uses SQLite; production uses MySQL.

### Seed Data (`data/seeds/`)

Pre-built datasets for quick setup:

- `graduation-topics.json` - Full 25,102 topics
- `graduation-topics-sample.json` - 1,000 sample topics
- `markov-chains.json` - Trained Markov chain data
- `major-markov-chains.json` - Field-specific chains

## Key Conventions

### TypeScript

- Strict mode enabled; avoid `any` types (use `unknown`)
- Explicit return types on functions
- PascalCase for classes/interfaces, camelCase for functions/variables
- kebab-case for file names (e.g., `text-processor.service.ts`)

### Prisma

- Use transactions for multi-step operations
- Soft delete via `deletedAt` timestamp
- Avoid N+1 queries with proper `select`/`include`

### Testing

- Unit tests in `test/unit/` (node environment)
- Integration tests in `test/integration/` (uses real database)
- Component tests in `test/components/` (jsdom environment)

### Pre-commit

Husky + lint-staged runs ESLint and Prettier automatically on staged files.
