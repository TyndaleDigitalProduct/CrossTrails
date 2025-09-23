# Project Structure

This document explains how the CrossTrails repository is organized and what each folder does.

## Overview

We're building a Bible study app that adds cross-references to NLT text and uses AI to help users discover more about the Bible. The app is a single full-stack Next.js application hosted on Vercel.

## Directory Structure

```
/
├── app/                    # Next.js App Router (main application)
├── lib/                    # Backend logic and utilities
├── components/             # Reusable UI components
├── data/                   # Public cross-reference data
├── types/                  # TypeScript type definitions
├── tests/                  # BDD scenarios and unit tests
├── docs/                   # Project documentation (this folder)
├── public/                 # Static assets (images, icons, etc.)
└── (config files)         # package.json, next.config.js, etc.
```

## Detailed Breakdown

### `/app` - Next.js App Router
Main application structure using Next.js 14+ App Router.

**Frontend Pages:**
- `page.tsx` - Home page with Bible text display
- `layout.tsx` - Main layout wrapper
- `globals.css` - Global styles

**API Routes (`/app/api/`):**
- `/bible/` - Endpoints for fetching NLT text from NLT.to API
- `/mcp/` - MCP (Model Context Protocol) server endpoints for biblical tools
- `/llm/` - AI/LLM integration that uses MCP tools for biblical insights

### `/lib` - Backend Logic
Core business logic and utilities.

- `/mcp-tools/` - Biblical knowledge tools (cross-references, commentaries, etc.)
- `/bible-api/` - Integration logic for NLT.to API
- `/utils/` - Shared utility functions

### `/components` - UI Components
Reusable React components for the frontend.

Examples:
- Bible text display components
- Cross-reference UI elements  
- AI insight displays
- Navigation and layout components

### `/data` - Public Data
**PUBLIC ONLY** - Cross-reference data that's safe to include in the repository.

⚠️ **Important**: Proprietary biblical scholarship data goes on Vercel separately, NOT in this folder.

### `/types` - TypeScript Definitions
Type definitions for our entire application.

Examples:
- Bible verse and passage types
- MCP tool interfaces
- API response types
- Component prop types

### `/tests` - Testing
BDD scenarios and unit tests.

- `/features/` - BDD feature files (Gherkin syntax)
- `/steps/` - Step definitions for BDD tests
- `/unit/` - Unit tests for individual functions/components

### `/docs` - Documentation
Project documentation for the team and hackathon judges.

- `PROJECT_STRUCTURE.md` - This file
- `SETUP.md` - How to get the project running locally
- `API.md` - API endpoint documentation

### `/public` - Static Assets
Static files served directly by Next.js:
- Images and icons
- Favicon
- Any other static resources

## Data Architecture

**Public Data (in repo):**
- Basic cross-reference mappings
- Public domain biblical data

**Private Data (Vercel only):**
- Proprietary biblical scholarship
- Enhanced commentary data
- Advanced cross-reference insights

## Team Workflow

Since we're working "all hands on everything":

1. **Frontend work** - Modify `/app` pages and `/components`
2. **API work** - Add endpoints in `/app/api/`
3. **Backend logic** - Build tools in `/lib`
4. **Types** - Keep `/types` updated as you build
5. **Testing** - Add scenarios in `/tests`

## Key Integration Points

1. **Bible Text Flow**: Frontend → `/api/bible` → NLT.to API
2. **AI Insights Flow**: Frontend → `/api/llm` → MCP tools → LLM → Response
3. **Cross-References**: Stored data + MCP tools + AI enhancement

## Next Steps for Contributors

1. Read `SETUP.md` to get your local environment running
2. Check `API.md` for endpoint documentation
3. Look at existing code in each folder to understand patterns
4. Ask questions in team chat!

Remember: We have 2 weeks, so keep it simple and functional. Perfect is the enemy of done! 🚀
