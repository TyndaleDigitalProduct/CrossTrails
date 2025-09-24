# CrossTrails

CrossTrails is a web application that enables users to explore the Bible through direct Scripture interaction and guided cross-reference discovery, powered by AI-assisted insights grounded in trusted biblical resources.

## Features

- **Clean Bible Reading Interface**: NLT text with optimal typography and spacing
- **Intelligent Cross-References**: Discover connections between passages with visual indicators
- **AI-Powered Insights**: Grounded conversations about biblical connections using Gloo AI Studio
- **Full Bible Coverage**: All 66 books supported from launch
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Gloo AI Studio API key (from docs.ai.gloo.com)

### Installation

1. **Clone and setup**:
   ```bash
   cd crosstrails
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Variables

Required variables (see `.env.local.example`):

- `GLOO_AI_API_KEY`: Your Gloo AI Studio API key
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for cross-reference data
- `NEXT_PUBLIC_APP_URL`: Your application URL

## Architecture

- **Frontend**: Next.js 14+ with App Router, Tailwind CSS
- **Backend**: Next.js API Routes with integrated MCP-style tools
- **AI**: Gloo AI Studio API with token optimization (4.1K vs 50K tokens)
- **Data**: NLT.to API for Bible text, Vercel Blob for cross-references
- **Deployment**: Vercel with Edge Runtime

## Development

### Scripts

- `npm run dev`: Start development server with Turbopack
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm run type-check`: TypeScript type checking

### Project Structure

```
crosstrails/
├── app/                    # Next.js App Router
│   ├── components/        # React components
│   ├── api/              # API routes (MCP tools)
│   └── globals.css       # Global styles
├── lib/                   # Utility libraries
│   ├── mcp-tools/        # MCP-style tool functions
│   ├── gloo/             # Gloo AI Studio integration
│   └── types/            # TypeScript type definitions
└── public/               # Static assets
```

## Deployment

### Vercel Deployment

1. **Connect to Vercel**:
   ```bash
   npm i -g vercel
   vercel
   ```

2. **Set environment variables**:
   ```bash
   vercel env add GLOO_AI_API_KEY production
   vercel env add BLOB_READ_WRITE_TOKEN production
   vercel env add NEXT_PUBLIC_APP_URL production
   ```

3. **Deploy**:
   ```bash
   vercel --prod
   ```

## Contributing

This project follows the comprehensive implementation plan. Key principles:

- NLT-only Bible translation
- Clean, readable design matching Figma specifications
- Token-optimized AI interactions
- Full Bible coverage from day one
- Grounded AI responses using trusted sources

## License

Private project for hackathon development.

## Team Communication

- **Primary**: Basecamp for async coordination
- **Weekly**: Tuesday afternoon team meetings
- **Emergency**: Slack/Discord for urgent coordination
- **Code**: GitHub with clear commit messages and PR reviews

---

Built with ❤️ for biblical exploration and discovery.