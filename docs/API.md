# API Documentation

This document describes all the API endpoints in our CrossTrails app.

# NOTE: Details on this page are NOT correct

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-app.vercel.app/api`

## Health Check

### GET `/health`

Basic health check to verify the application is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-23T10:00:00Z",
  "services": {
    "nlt_api": "connected",
    "gloo_ai": "connected",
    "mcp_server": "running"
  }
}
```

## Bible Text API

Endpoints for fetching Bible text from NLT.to API.

### GET `/bible/passage`

Fetch a specific Bible passage.

**Query Parameters:**
- `reference` (required) - Bible reference (e.g., "John 3:16", "Genesis 1:1-10")
- `format` - Response format: `json` (default) or `text`

**Example Request:**
```
GET /api/bible/passage?reference=John%203:16
```

**Response:**
```json
{
  "reference": "John 3:16",
  "text": "For this is how God loved the world: He gave his one and only Son, so that everyone who believes in him will not perish but have eternal life.",
  "translation": "NLT",
  "book": "John",
  "chapter": 3,
  "verse": 16
}
```

### GET `/bible/search`

Search Bible text by keywords.

**Query Parameters:**
- `query` (required) - Search terms
- `limit` - Maximum results (default: 10)

**Example Request:**
```
GET /api/bible/search?query=love&limit=5
```

**Response:**
```json
{
  "query": "love",
  "results": [
    {
      "reference": "John 3:16",
      "text": "For this is how God loved the world...",
      "relevance_score": 0.95
    }
  ]
}
```

## MCP (Model Context Protocol) API

Endpoints for biblical knowledge tools and cross-references.

### POST `/mcp/cross-references`

Get cross-references for a Bible passage.

**Request Body:**
```json
{
  "reference": "John 3:16",
  "context_level": "basic" | "detailed"
}
```

**Response:**
```json
{
  "primary_reference": "John 3:16",
  "cross_references": [
    {
      "reference": "Romans 5:8",
      "text": "But God showed his great love for us...",
      "relationship": "theme",
      "relevance_score": 0.92
    }
  ]
}
```

### POST `/mcp/commentary`

Get biblical commentary and insights.

**Request Body:**
```json
{
  "reference": "John 3:16",
  "commentary_type": "historical" | "theological" | "practical"
}
```

**Response:**
```json
{
  "reference": "John 3:16",
  "commentary": {
    "type": "theological",
    "insights": [
      {
        "topic": "God's Love",
        "content": "This verse demonstrates the universal scope of God's love...",
        "sources": ["Biblical Theology", "Historical Context"]
      }
    ]
  }
}
```

### GET `/mcp/tools`

List available MCP tools.

**Response:**
```json
{
  "tools": [
    {
      "name": "cross_references",
      "description": "Find related Bible passages",
      "parameters": ["reference", "context_level"]
    },
    {
      "name": "commentary",
      "description": "Get biblical commentary",
      "parameters": ["reference", "commentary_type"]
    }
  ]
}
```

## LLM Integration API

Endpoints for AI-powered biblical insights using MCP tools.

### POST `/llm/insights`

Generate AI insights about a Bible passage using MCP tools.

**Request Body:**
```json
{
  "reference": "John 3:16",
  "user_question": "What does this teach us about God's character?",
  "use_cross_references": true,
  "use_commentary": true
}
```

**Response:**
```json
{
  "reference": "John 3:16",
  "user_question": "What does this teach us about God's character?",
  "ai_response": "This passage reveals several key aspects of God's character...",
  "supporting_passages": [
    {
      "reference": "Romans 5:8",
      "relevance": "Shows the timing of God's love"
    }
  ],
  "mcp_tools_used": ["cross_references", "commentary"]
}
```

### POST `/llm/study-questions`

Generate study questions for a Bible passage.

**Request Body:**
```json
{
  "reference": "John 3:16",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "question_types": ["comprehension", "application", "reflection"]
}
```

**Response:**
```json
{
  "reference": "John 3:16",
  "study_questions": [
    {
      "type": "comprehension",
      "question": "According to this verse, why did God give His Son?",
      "suggested_answer": "Because He loved the world"
    }
  ]
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details if applicable"
  }
}
```

**Common Error Codes:**
- `INVALID_REFERENCE` - Bible reference format is invalid
- `PASSAGE_NOT_FOUND` - Requested passage doesn't exist
- `API_LIMIT_EXCEEDED` - Rate limit exceeded
- `EXTERNAL_API_ERROR` - Error from NLT.to or other external APIs
- `MCP_TOOL_ERROR` - Error in MCP tool execution
- `LLM_ERROR` - Error in AI/LLM processing

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `401` - Unauthorized (missing/invalid API key)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Rate Limits

- **NLT.to API**: Follow their rate limits (TBD)
- **Gloo AI API**: Check your plan limits
- **General API**: 100 requests per minute per IP

## Authentication

Most endpoints don't require authentication since there are no user accounts. However, some internal endpoints may require API keys in headers:

```
Authorization: Bearer YOUR_API_KEY
```

## Development Notes

### Adding New Endpoints

1. Create the route file in `/app/api/[endpoint]/route.ts`
2. Add TypeScript types in `/types/api.ts`
3. Update this documentation
4. Add tests in `/tests/api/`

### MCP Tool Development

1. Create tool in `/lib/mcp-tools/`
2. Register in MCP server configuration
3. Add endpoint in `/app/api/mcp/`
4. Document here

### External API Integration

- **NLT.to API**: Documentation at [api.nlt.to](https://api.nlt.to/docs) (if available)
- **Gloo AI Studio**: Check their documentation for latest features

## Testing

Test all endpoints using:
- Browser for GET requests
- Postman/Insomnia for POST requests  
- curl for quick testing
- Automated tests in `/tests/api/`

**Example curl commands:**
```bash
# Health check
curl http://localhost:3000/api/health

# Get Bible passage
curl "http://localhost:3000/api/bible/passage?reference=John%203:16"

# Get cross-references
curl -X POST http://localhost:3000/api/mcp/cross-references \
  -H "Content-Type: application/json" \
  -d '{"reference":"John 3:16","context_level":"basic"}'
```

---

**Note**: This is a living document. Update it as you build new endpoints and features!
