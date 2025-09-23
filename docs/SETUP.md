# Setup Guide

Quick guide to get the Bible study app running on your local machine.

## Prerequisites

Make sure you have these installed:
- **Node.js 20+** - [Download here](https://nodejs.org/)
- **npm 9+** - Comes with Node.js
- **Git** - [Download here](https://git-scm.com/)
- **Code editor** - VS Code recommended

## Quick Start

1. **Clone the repository**
   ```bash
   git clone [REPO_URL]
   cd [PROJECT_NAME]
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your actual values:
   ```env
   # Required
   GLOO_AI_API_KEY=your_gloo_ai_api_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   
   # Optional: Custom NLT.to API settings (if needed)
   NLT_API_BASE_URL=https://api.nlt.to/v1
   
   # Private data URLs (will be provided separately)
   PRIVATE_BIBLICAL_DATA_URL=
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Go to [http://localhost:3000](http://localhost:3000)

## Verification

After setup, check that everything works:

- [ ] Home page loads without errors
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Linting passes: `npm run lint`
- [ ] Health check works: `GET /api/health`

## Available Commands

### Development
```bash
npm run dev          # Start development server
npm run type-check   # Check TypeScript types
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Production
```bash
npm run build        # Build for production
npm run start        # Start production server
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:bdd     # Run BDD scenarios (once implemented)
```

## Environment Setup Details

### Required Environment Variables

- **`GLOO_AI_API_KEY`** - Your Gloo AI Studio API key for LLM integration
- **`NEXT_PUBLIC_APP_URL`** - Your app's URL (localhost for dev, production URL for deploy)

### Optional Environment Variables

- **`NLT_API_BASE_URL`** - Base URL for NLT.to API (defaults to their standard endpoint)
- **`PRIVATE_BIBLICAL_DATA_URL`** - URL for proprietary biblical data (hosted separately on Vercel)

### Getting API Keys

1. **Gloo AI Studio API Key**:
   - Sign up at [Gloo AI Studio](https://gloo.ai/)
   - Create a new project
   - Generate API key
   - Add to your `.env.local`

2. **NLT.to API**:
   - Check if we need special API access or if public endpoints work
   - [NLT.to API Documentation](https://api.nlt.to/docs) (if available)

## Development Workflow

### Working on Frontend
1. Edit files in `/app` for pages
2. Add components in `/components`
3. Update styles in `/app/globals.css` or component files

### Working on Backend/API
1. Add new API routes in `/app/api/`
2. Build MCP tools in `/lib/mcp-tools/`
3. Create utilities in `/lib/utils/`

### Working on Types
1. Add TypeScript definitions in `/types/`
2. Export from `/types/index.ts`
3. Import where needed: `import { BibleVerse } from '@/types'`

## Common Issues

### Port Already in Use
```bash
npm run dev -- -p 3001  # Use port 3001 instead
```

### Environment Variables Not Loading
- Restart dev server after changing `.env.local`
- Make sure `.env.local` is in root directory
- Check that variables don't have spaces around `=`

### TypeScript Errors
```bash
npm run type-check  # See all TypeScript errors
```

### API Calls Failing
- Check that environment variables are set correctly
- Verify API keys are valid
- Check browser console for error messages
- Test API endpoints directly: `curl http://localhost:3000/api/health`

## Project Structure Quick Reference

```bash
/app/api/bible/     # Bible text API (NLT.to integration)
/app/api/mcp/       # MCP server endpoints
/app/api/llm/       # AI integration endpoints
/lib/mcp-tools/     # Biblical knowledge tools
/components/        # React components
/types/             # TypeScript definitions
```

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test locally: `npm run dev`, `npm run type-check`, `npm run lint`
4. Commit: `git commit -m "Add your feature"`
5. Push: `git push origin feature/your-feature`
6. Create a Pull Request

## Deployment

The app auto-deploys to Vercel when you push to `main` branch.

**Manual deployment:**
1. Connect repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy

## Getting Help

- Check the console for error messages
- Look at existing code in similar files
- Ask in team chat
- Check the other docs in `/docs/`

## Next Steps

1. Get the basic app running locally
2. Explore the codebase
3. Pick a task and start coding!
4. Read `API.md` for endpoint details

Ready to build something awesome! 📖✨
