# CrossTrails API Data Format Requirements

## Overview

The CrossTrails API endpoints have specific data format requirements. Raw JSON data from files (like `John.json`) must be transformed into proper TypeScript interface formats before being used with API endpoints.

## 🎯 Critical: CrossReference Data Format

### ❌ Wrong Format (Raw JSON)
```json
{
  "anchor_ref": "John.1.9",
  "cross_ref": "1Jn.2.8", 
  "primary_category": "literary_parallel",
  "secondary_category": "theological_principle",
  "confidence": 88,
  "reasoning": "Connection explanation..."
}
```

### ✅ Correct Format (API Expected)
```json
{
  "reference": "1Jn.2.8",
  "display_ref": "1 John 2:8", 
  "text": "Verse text here...",
  "anchor_ref": "John.1.9",
  "connection": {
    "categories": ["literary_parallel", "theological_principle"],
    "strength": 0.88,
    "type": "thematic",
    "explanation": "Connection explanation..."
  }
}
```

## 📡 API Endpoints Data Requirements

### POST `/api/cross-refs/prompt`

**Purpose**: Generate cross-reference analysis prompts

**Required Request Format**:
```typescript
{
  crossReference: CrossReference,  // ⚠️ MUST be properly formatted
  userObservation?: string,
  promptTemplate?: "default" | "study" | "devotional" | "academic", 
  contextRange?: number
}
```

**TypeScript Interface**:
```typescript
interface CrossReference {
  reference: string;        // e.g., "1Jn.2.8"
  display_ref: string;      // e.g., "1 John 2:8"  
  text: string;             // Actual verse text
  anchor_ref: string;       // e.g., "John.1.9"
  connection: ConnectionData;
}

interface ConnectionData {
  categories: string[];     // ⚠️ MUST be array, not separate fields
  strength: number;         // ⚠️ MUST be 0.0-1.0, not percentage 
  type: ConnectionType;     // "parallel" | "contrast" | etc.
  explanation?: string;
}
```

### POST `/api/cross-refs/analyze`

**Purpose**: Full LLM analysis of cross-references  

**Same CrossReference format requirements as above**

### POST `/api/cross-refs/analyze/stream`

**Purpose**: Streaming LLM analysis

**Same CrossReference format requirements as above**

## 🔄 Data Transformation Guide

### Method 1: Use Data Access Layer (Recommended)

```typescript
import { getCrossReferenceConnection } from '@/lib/mcp-tools/getCrossReferenceConnection'

// Transform raw JSON through data access layer
const connectionRequest = {
  anchor_verse: rawData.anchor_ref,
  candidate_refs: [rawData.cross_ref], 
  min_strength: 0.5
}

const connectionResponse = await getCrossReferenceConnection(connectionRequest)
// Use connectionResponse.connections[0] to build proper CrossReference
```

### Method 2: Manual Transformation

```typescript
function transformRawToCrossReference(rawData: any): CrossReference {
  return {
    reference: rawData.cross_ref,
    display_ref: rawData.cross_ref.replace(/\./g, ' '),
    text: "", // Fetch from verse API
    anchor_ref: rawData.anchor_ref,
    connection: {
      categories: [
        rawData.primary_category, 
        rawData.secondary_category
      ].filter(Boolean),
      strength: rawData.confidence / 100, // Convert percentage to decimal
      type: mapCategoryToType(rawData.primary_category),
      explanation: rawData.reasoning || rawData.explanation
    }
  }
}
```

## ⚠️ Common Errors

### 1. Array vs String Fields
```typescript
// ❌ Wrong - will cause TypeError: Cannot read properties of undefined (reading 'join')
connection: "Some explanation string"

// ✅ Correct
connection: {
  categories: ["category1", "category2"],
  // ...
}
```

### 2. Percentage vs Decimal Strength
```typescript
// ❌ Wrong
strength: 88  // Percentage format

// ✅ Correct  
strength: 0.88  // Decimal format (0.0-1.0)
```

### 3. Missing Required Fields
```typescript
// ❌ Wrong - missing display_ref and text
{
  reference: "1Jn.2.8",
  anchor_ref: "John.1.9"
}

// ✅ Correct - all required fields
{
  reference: "1Jn.2.8", 
  display_ref: "1 John 2:8",
  text: "Verse text...",
  anchor_ref: "John.1.9",
  connection: { /* ... */ }
}
```

## 🧪 Testing Data Formats

Use the test page at `/test-api.html` to verify your data format:

```javascript
// Test your CrossReference format
const testCrossReference = {
  reference: "1Jn.2.8",
  display_ref: "1 John 2:8", 
  text: "",
  anchor_ref: "John.1.9",
  connection: {
    categories: ["literary_parallel", "theological_principle"],
    strength: 0.88,
    type: "thematic",
    explanation: "Your explanation here"
  }
}
```

## 📚 Integration Examples

### Frontend React Hook
```typescript
import { useCrossReferencePrompt } from '@/hooks/useCrossReferencePrompt'

function MyComponent() {
  // Ensure rawData is transformed before using
  const properCrossRef = transformRawToCrossReference(rawJsonData)
  
  const { generatePrompt, loading, error } = useCrossReferencePrompt()
  
  const handleGenerate = async () => {
    await generatePrompt({
      crossReference: properCrossRef, // ⚠️ Must be proper format
      userObservation: "My observation"
    })
  }
}
```

### Backend API Usage
```typescript
// In your API route
app.post('/my-endpoint', async (req, res) => {
  const rawData = req.body
  
  // ⚠️ MUST transform raw data first
  const properFormat = transformRawToCrossReference(rawData)
  
  // Now safe to call CrossTrails API
  const response = await fetch('/api/cross-refs/prompt', {
    method: 'POST',
    body: JSON.stringify({
      crossReference: properFormat
    })
  })
})
```

## 🎯 Best Practices

1. **Always validate data format** before calling API endpoints
2. **Use TypeScript interfaces** to catch format errors at compile time  
3. **Transform raw JSON data** through the data access layer when possible
4. **Test with `/test-api.html`** to verify your data format
5. **Handle both formats gracefully** in production code

## 🔧 Troubleshooting

### Error: "Cannot read properties of undefined (reading 'join')"
- **Cause**: `connection.categories` is not an array
- **Fix**: Ensure categories is `string[]`, not individual fields

### Error: Missing required properties 
- **Cause**: CrossReference object missing `display_ref`, `text`, etc.
- **Fix**: Use complete CrossReference interface format

### Error: Invalid connection type
- **Cause**: `connection.type` not a valid ConnectionType
- **Fix**: Use one of: "parallel", "contrast", "fulfillment", "prophecy", "quotation", "allusion", "thematic", "historical"