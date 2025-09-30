# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CrossTrails is a Next.js 15 web application that enables Bible exploration through direct Scripture interaction and guided cross-reference discovery, powered by AI-assisted insights grounded in trusted biblical resources. The app displays NLT (New Living Translation) text with visual cross-reference indicators and uses Gloo AI Studio for generating biblical insights.

## Development Commands

### Primary Commands
```bash
npm run dev           # Start development server with Turbopack
npm run build         # Build for production with Turbopack
npm run start         # Start production server
npm run lint          # Run ESLint
npm run type-check    # Run TypeScript type checking
```

### Environment Setup
```bash
cp .env.example .env.local
# Edit .env.local with:
# - GLOO_AI_API_KEY (required)
# - NEXT_PUBLIC_APP_URL (default: http://localhost:3000)
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router and Turbopack
- **Runtime**: Edge Runtime for API routes (streaming support)
- **AI**: Gloo AI Studio API with OAuth2 token authentication
- **Bible Data**: NLT.to API for Bible text
- **Storage**: Vercel Blob for cross-reference data
- **Styling**: Tailwind CSS v4
- **TypeScript**: Strict mode enabled

### Project Structure

```
/app                          # Next.js App Router
  /components                 # React components (Header, BibleReader, CrossReferencesSidebar, AICompanion)
  /api                        # API routes
    /verses                   # Fetch Bible text
    /cross-refs               # Get cross-references
    /explore                  # AI insights (streaming)
    /health                   # Health check
  layout.tsx                  # Root layout
  page.tsx                    # Home page
  globals.css                 # Global styles

/lib                          # Backend logic
  /types/index.ts             # TypeScript type definitions (central source of truth)
  /mcp-tools/                 # MCP-style biblical tools
    getVerseContext.ts        # Fetch verses with context
    getCrossReferenceConnection.ts
    getStudyNotes.ts
    getDictionaryArticles.ts
  /utils/auth.ts              # Gloo OAuth2 authentication

/data                         # Public biblical data (Tyndale Open resources)
```

### Import Aliases (tsconfig.json)
```typescript
@/*           -> ./*
@/app/*       -> ./app/*
@/lib/*       -> ./lib/*
@/components/* -> ./app/components/*
```

## Key Architecture Patterns

### MCP-Style Tool System
The application uses a Model Context Protocol (MCP) inspired architecture where biblical tools are modular functions that can be composed:

- **Tools** live in `/lib/mcp-tools/` and implement specific biblical knowledge operations
- **API routes** in `/app/api/` orchestrate tools and handle HTTP
- **Types** in `/lib/types/index.ts` define interfaces for all tools and data structures

Each MCP tool follows this pattern:
```typescript
export async function toolName(request: ToolRequest): Promise<ToolResponse> {
  // Tool implementation
}
```

### Authentication Flow (Gloo AI)
Authentication uses OAuth2 client credentials with token caching:
1. `ensureValidToken()` checks if cached token is valid
2. If expired, calls `getAccessToken()` to refresh
3. `makeAuthenticatedRequest()` handles API calls with auth headers
4. Token is stored globally in `lib/utils/auth.ts` with `expires_at` tracking

### API Streaming Pattern
The `/api/explore` endpoint uses Edge Runtime with streaming responses:
- Receives `ExploreQuery` with selected verses, cross-refs, and user observation
- Gathers context using MCP tools
- Streams AI response using `ReadableStream`
- Returns `text/plain` with `Cache-Control: no-cache`

### Bible Reference Format
Consistent reference format throughout: `Book.Chapter.Verse`
- Example: `"John.3.16"`, `"Matthew.2.5"`
- Parsed as: `const [book, chapter, verse] = reference.split('.')`

### Cross-Reference System
Cross-references include rich metadata:
- **ConnectionType**: parallel, contrast, fulfillment, prophecy, quotation, allusion, thematic, historical
- **Strength**: 0.0 to 1.0 relevance score
- **Categories**: Array of thematic tags (e.g., ["salvation", "love", "sacrifice"])

### Type System Organization
All TypeScript types are centralized in `/lib/types/index.ts`:
- Bible text types: `BibleVerse`, `BibleChapter`
- Cross-reference types: `CrossReference`, `CrossReferenceGroup`, `ConnectionType`
- MCP tool types: `VerseContextRequest`, `CrossReferenceConnectionRequest`
- AI types: `ExploreQuery`, `AIResponse`, `ConversationTurn`
- API types: `APIError`, `VersesAPIResponse`
- Component prop types: `BibleReaderProps`, `CrossReferencesSidebarProps`, etc.

## Important Implementation Notes

### Translation Lock
CrossTrails exclusively uses the NLT (New Living Translation). Do not add support for other translations without explicit team discussion.

### Token Optimization
The Gloo AI integration is designed for token efficiency:
- Use MCP tools to gather only necessary context
- Avoid sending full chapter text when verse snippets suffice
- Target ~4.1K tokens per request (vs naive 50K approach)

### Data Boundaries
- **Public data** (Tyndale Open resources) goes in `/data/`
- **Proprietary data** (enhanced cross-references, NLT files if needed) stays on Vercel Blob
- Never commit proprietary biblical scholarship to git

### Edge Runtime Constraints
API routes use Edge Runtime for streaming:
- Limited to Web APIs (no Node.js-specific modules)
- Use `fetch` instead of `axios` where possible in Edge routes
- Token caching must work with Edge limitations

### Error Handling Pattern
All API errors follow standardized `APIError` interface:
```typescript
{
  error: {
    code: string,        // e.g., "MISSING_VERSES"
    message: string,     // Human-readable
    timestamp: string,   // ISO 8601
    request_id: string   // For tracking
  }
}
```

## Testing Workflow

Since this is a hackathon project, the testing infrastructure is lightweight:
- Test API endpoints with curl or Postman
- Verify type checking: `npm run type-check`
- Run linting: `npm run lint`
- Manual testing in browser during development

## Common Development Tasks

### Adding a New MCP Tool
1. Create tool function in `/lib/mcp-tools/[toolname].ts`
2. Define request/response types in `/lib/types/index.ts`
3. Export tool function
4. Use tool in API routes (e.g., `/app/api/explore/route.ts`)

### Adding a New API Endpoint
1. Create `/app/api/[endpoint]/route.ts`
2. Export async functions: `GET`, `POST`, etc.
3. Add `export const runtime = 'edge'` for streaming support
4. Use types from `/lib/types/index.ts`
5. Follow `APIError` pattern for errors

### Adding a New Component
1. Create component in `/app/components/[Component].tsx`
2. Define prop types in `/lib/types/index.ts`
3. Import types: `import { ComponentProps } from '@/lib/types'`
4. Use Tailwind CSS for styling

### Working with Bible Data
Currently using mock data for Matthew 2 in development. To add real Bible text:
1. Integrate with NLT.to API in `/lib/mcp-tools/getVerseContext.ts`
2. Replace `fetchVerse()` mock implementation
3. Cache responses appropriately
4. Handle API rate limits

## Deployment

The application is configured for Vercel deployment:
- Auto-deploys from `main` branch
- Environment variables set in Vercel dashboard
- Edge Runtime enabled for API routes
- Turbopack used for builds

## Team Notes

This is a hackathon project with a 2-week timeline. The codebase prioritizes:
- **Functionality over perfection** - Working features first
- **Clear structure** - Easy for team members to navigate
- **Type safety** - Leverage TypeScript to catch issues
- **Token efficiency** - Optimize AI costs from the start

The API documentation in `/docs/API.md` is marked as NOT CORRECT - refer to actual route files for current implementation.