# Context - Business Rules Documentation

This document describes the core business logic for property feature extraction and intelligent property ranking.

---

## Table of Contents

1. [Property Features Generation](#property-features-generation)
2. [Property Ranking System](#property-ranking-system)
3. [Data Flow Diagrams](#data-flow-diagrams)

---

## Property Features Generation

### Overview

Property features are automatically extracted from user notes using AI (LLM). When multiple notes exist for a property, the system aggregates all AI outputs to create a unified feature profile.

### Feature Fields

| Field | Type | Description |
|-------|------|-------------|
| `nearSubway` | boolean | Property is near subway/metro station |
| `needsRenovation` | boolean | Property requires renovation |
| `estimatedCapacityPeople` | integer | Estimated occupancy capacity |
| `recommendedUse` | enum | Recommended usage: `office`, `warehouse`, or `retail` |

### Event-Driven Processing Flow

```
User Creates Note
        │
        ▼
┌─────────────────────────┐
│  note.created event     │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  LLM Analysis           │
│  (Groq API)             │
│  - Extract features     │
│  - Parse JSON response  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  note.processed event   │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Aggregation            │
│  - Fetch all notes      │
│  - Majority voting      │
│  - Average calculation  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  PropertyFeature        │
│  (Upsert)               │
└─────────────────────────┘
```

### AI Extraction Rules

The LLM extracts features based on these rules:

| Condition | Result |
|-----------|--------|
| Note mentions "near subway", "close to metro" | `nearSubway = true` |
| Note mentions "needs renovation", "requires work" | `needsRenovation = true` |
| Note mentions capacity/people count | `estimatedCapacityPeople = <number>` |
| Note implies property type | `recommendedUse = office/warehouse/retail` |
| Field not mentioned | Value is `null` |

### Aggregation Algorithm

When multiple notes exist, features are combined using:

#### Boolean Fields (nearSubway, needsRenovation)

**Method:** Majority Voting with Tiebreaker

```
Example:
  Note 1: nearSubway = true
  Note 2: nearSubway = false
  Note 3: nearSubway = true

  Result: true (2 vs 1)

Tiebreaker (when equal):
  Note 1: needsRenovation = true
  Note 2: needsRenovation = false

  Result: false (latest note wins)
```

#### Numeric Fields (estimatedCapacityPeople)

**Method:** Average with Rounding

```
Example:
  Note 1: 50 people
  Note 2: 100 people
  Note 3: 70 people

  Average: (50 + 100 + 70) / 3 = 73.33
  Result: 73 (rounded)
```

#### Enum Fields (recommendedUse)

**Method:** Majority Voting with Tiebreaker

```
Example:
  Note 1: office
  Note 2: warehouse
  Note 3: office

  Result: office (2 vs 1)
```

---

## Property Ranking System

### Overview

The ranking system uses AI to interpret natural language queries and score properties based on how well they match the user's requirements. Each property receives a score from 0 to 10.

### API Endpoint

```
POST /properties/rank
Body: { "text": "Client looking for an office near subway, budget up to $500k" }
```

### Filter Extraction

The LLM extracts these criteria from natural language:

| Field | Type | Example Input | Extracted Value |
|-------|------|---------------|-----------------|
| `city` | string | "in New York" | `"New York"` |
| `neighborhood` | string | "downtown area" | `"downtown"` |
| `minPrice` | number | "at least 200k" | `200000` |
| `maxPrice` | number | "up to 500k" | `500000` |
| `minArea` | number | "minimum 100m2" | `100` |
| `maxArea` | number | "around 500m2" | `550` (500 × 1.1) |
| `nearSubway` | boolean | "near subway" | `true` |
| `needsRenovation` | boolean | "needs renovation" | `true` |
| `recommendedUse` | enum | "for office use" | `"office"` |
| `estimatedCapacityPeople` | number | "for 20 people" | `20` |

### Scoring Algorithm

#### Formula

```
score = round((matchCount / totalFields) × 10)
```

Where:
- `matchCount` = Number of criteria the property satisfies
- `totalFields` = Total number of criteria extracted from the query

#### Criteria Types

**Property-Level Criteria** (SQL filters):
- City match
- Neighborhood match
- Property type match
- Price within range
- Area within range

**Feature-Level Criteria** (Post-query matching):
- nearSubway
- needsRenovation
- recommendedUse
- estimatedCapacityPeople (only if > 0)

### Scoring Example

**User Query:**
```
"Looking for an office in New York, near subway, budget up to $1M"
```

**Extracted Criteria:**
| Criterion | Value | Type |
|-----------|-------|------|
| city | New York | Property |
| propertyType | office | Property |
| maxPrice | 1000000 | Property |
| nearSubway | true | Feature |
| recommendedUse | office | Feature |

**Total Fields: 5**

**Property Scoring:**

| Property | City | Type | Price | Near Subway | Rec. Use | Match Count | Score |
|----------|------|------|-------|-------------|----------|-------------|-------|
| A | Yes | office | Yes | Yes | office | 5/5 | **10** |
| B | Yes | office | Yes | Yes | warehouse | 4/5 | **8** |
| C | Yes | office | Yes | No | office | 4/5 | **8** |
| D | Yes | warehouse | Yes | No | warehouse | 3/5 | **6** |

### Response

Properties are returned sorted by score (highest first):

```json
[
  {
    "id": "uuid-a",
    "title": "Downtown Office Space",
    "city": "New York",
    "price": 800000,
    "feature": {
      "nearSubway": true,
      "recommendedUse": "office"
    },
    "score": 10
  },
  {
    "id": "uuid-b",
    "title": "Commercial Building",
    "score": 8
  }
]
```

---

## Data Flow Diagrams

### Note Creation to Feature Update

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    User      │    │   Backend    │    │   Groq API   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │
       │  POST /notes      │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │                   │  note.created     │
       │                   │  (async event)    │
       │                   │                   │
       │  201 Created      │  Analyze text     │
       │◀──────────────────│──────────────────▶│
       │                   │                   │
       │                   │  JSON features    │
       │                   │◀──────────────────│
       │                   │                   │
       │                   │  note.processed   │
       │                   │  (async event)    │
       │                   │                   │
       │                   │  Aggregate &      │
       │                   │  Upsert Feature   │
       │                   │                   │
```

### Property Ranking Request

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    User      │    │   Backend    │    │   Groq API   │    │   Database   │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                   │                   │
       │  POST /rank       │                   │                   │
       │  "office near...  │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │                   │                   │
       │                   │  Extract filters  │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │                   │
       │                   │  JSON filters     │                   │
       │                   │◀──────────────────│                   │
       │                   │                   │                   │
       │                   │  Query with       │                   │
       │                   │  property filters │                   │
       │                   │──────────────────────────────────────▶│
       │                   │                   │                   │
       │                   │  Properties +     │                   │
       │                   │  Features         │                   │
       │                   │◀──────────────────────────────────────│
       │                   │                   │                   │
       │                   │  Calculate scores │                   │
       │                   │  Sort by score    │                   │
       │                   │                   │                   │
       │  Ranked results   │                   │                   │
       │◀──────────────────│                   │                   │
       │                   │                   │                   │
```

---

## Configuration

### LLM Settings

| Setting | Value | Description |
|---------|-------|-------------|
| Provider | Groq API | LLM service provider |
| Model | meta-llama/llama-4-scout-17b-16e-instruct | Model for text analysis |
| Temperature | 0 | Deterministic output |
| Max Tokens | 150 | Response limit |

### Environment Variables

```env
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
GROQ_API_KEY=<your-api-key>
```
