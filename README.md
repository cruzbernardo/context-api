# Context API

A property management platform with AI-powered features built with NestJS, TypeORM, and PostgreSQL.

## Features

- **Property Management**: CRUD operations for commercial properties (office, warehouse, retail)
- **AI-Powered Notes**: Property notes are analyzed by AI to extract features automatically
- **Smart Property Ranking**: Natural language search with AI-powered scoring (0-10)
- **Feature Aggregation**: Multiple notes are aggregated using majority voting and averaging

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL 15 with TypeORM
- **AI Integration**: Groq API (Llama 3.3 70B)
- **Authentication**: JWT with bcrypt
- **Documentation**: Swagger/OpenAPI
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- Groq API key (for AI features)

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd context-api
```

2. Create environment file:
```bash
cp .env.local.example .env
```

3. Add your Groq API key to `.env`:
```env
GROQ_API_KEY=your_groq_api_key_here
```

4. Start the application:
```bash
docker compose up -d
```

5. Access the API:
- API: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/authentication/sign-up` | Register new user |
| POST | `/authentication/sign-in` | Login user |
| GET | `/authentication/me` | Get current user |

### Properties
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/properties` | Create property |
| GET | `/properties` | List properties (with filters) |
| GET | `/properties/:id` | Get property details |
| PATCH | `/properties/:id` | Update property |
| DELETE | `/properties/:id` | Soft delete property |
| POST | `/properties/rank` | AI-powered property ranking |

### Property Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/property-notes` | Create note (triggers AI analysis) |
| GET | `/property-notes/property/:propertyId` | Get notes for property |
| GET | `/property-notes/:id` | Get single note |
| DELETE | `/property-notes/:id` | Soft delete note |

### Property Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/property-features/property/:propertyId` | Get AI-extracted features |

## Core Business Rules

### Property Features Generation

When a note is added to a property, the system automatically:

1. **AI Analysis**: Sends the note text to the LLM for feature extraction
2. **Feature Extraction**: Identifies key attributes from natural language:
   - `nearSubway`: Proximity to public transit
   - `needsRenovation`: Property condition
   - `estimatedCapacityPeople`: Space capacity
   - `recommendedUse`: Best property type (office/warehouse/retail)

3. **Aggregation**: When multiple notes exist, features are combined:

| Feature | Aggregation Method |
|---------|-------------------|
| `nearSubway` | Majority vote (tie: latest note wins) |
| `needsRenovation` | Majority vote (tie: latest note wins) |
| `estimatedCapacityPeople` | Average (rounded to nearest integer) |
| `recommendedUse` | Majority vote (tie: latest note wins) |

**Example Flow:**
```
Note 1: "Great office near the L train, fits 30 people"
  → nearSubway: true, capacity: 30, recommendedUse: office

Note 2: "Actually closer to 40 people, very spacious"
  → capacity: 40

Aggregated Result:
  → nearSubway: true, capacity: 35, recommendedUse: office
```

### Property Ranking System

The `/properties/rank` endpoint accepts natural language queries and returns properties scored 0-10.

**Scoring Formula:**
```
score = round((matched_criteria / total_criteria) × 10)
```

**Criteria Matching:**
1. Property-level: `city`, `propertyType`, `price`, `areaM2`
2. Feature-level: `nearSubway`, `needsRenovation`, `estimatedCapacityPeople`, `recommendedUse`

**Example Query:**
```json
{
  "text": "Office in New York, near subway, under $1M, for 50 people"
}
```

**Extracted Criteria:**
- city: "New York"
- propertyType: "office"
- maxPrice: 1000000
- nearSubway: true
- estimatedCapacityPeople: 50

**Scoring Example:**
- Property matches 4/5 criteria → Score: 8
- Property matches 3/5 criteria → Score: 6
- Property matches 1/5 criteria → Score: 2

## Seed Data

The application includes seed migrations that populate the database with sample data for testing and development.

### Demo User

A demo user is automatically created for testing:

| Field | Value |
|-------|-------|
| Email | `demo@context.com` |
| Password | `demouser` |
| Name | Demo User |

Use these credentials to sign in via `/authentication/sign-in`.

### Seeded Properties (10 total)

| Property | City | Type | Price | Area (m²) |
|----------|------|------|-------|-----------|
| Modern Downtown Office Space | New York | office | $850,000 | 250 |
| Prime Retail Storefront | Los Angeles | retail | $1,200,000 | 180 |
| Industrial Warehouse Complex | Chicago | warehouse | $2,500,000 | 1,500 |
| Tech Startup Office Hub | San Francisco | office | $1,800,000 | 400 |
| Boutique Shopping Space | Miami | retail | $650,000 | 120 |
| Distribution Center Warehouse | Dallas | warehouse | $3,200,000 | 2,500 |
| Creative Agency Office | Austin | office | $550,000 | 200 |
| Corner Retail Property | Seattle | retail | $780,000 | 150 |
| Cold Storage Warehouse | Denver | warehouse | $1,900,000 | 1,200 |
| Executive Office Suite | Boston | office | $1,100,000 | 300 |

### Seeded Property Features (7 of 10 properties)

To demonstrate that not all properties have AI-extracted features, only 7 properties are seeded with features:

| Property | Near Subway | Needs Renovation | Capacity | Recommended Use |
|----------|-------------|------------------|----------|-----------------|
| Modern Downtown Office Space | No | No | 50 | office |
| Industrial Warehouse Complex | No | Yes | 120 | warehouse |
| Tech Startup Office Hub | Yes | No | 80 | office |
| Distribution Center Warehouse | No | No | 200 | warehouse |
| Corner Retail Property | Yes | No | 25 | retail |
| Cold Storage Warehouse | No | Yes | 100 | warehouse |
| Executive Office Suite | Yes | No | 60 | office |

**Properties without features** (simulating properties with no notes yet):
- Prime Retail Storefront (Los Angeles)
- Boutique Shopping Space (Miami)
- Creative Agency Office (Austin)

### Seeded Notes

Each property with features has a corresponding note created by the Demo User. These notes contain descriptions that would result in the AI extracting the features shown above. For example:

> "Modern tech office in SoMa district. Very close to BART subway station. Recently renovated, no work needed. Open floor plan that can accommodate 80 employees easily."

This demonstrates the complete flow: notes → AI analysis → feature extraction.

### Running Migrations

Migrations run automatically on startup. To run manually:

```bash
docker compose exec api npm run migration:run
```

## Development

### Running Tests

```bash
# Unit tests
docker compose exec api npm test

# Test coverage
docker compose exec api npm run test:cov

# Watch mode
docker compose exec api npm run test:watch
```

### Linting

```bash
docker compose exec api npm run lint
```

### Building

```bash
docker compose exec api npm run build
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API port | 3000 |
| `NODE_ENV` | Environment | local |
| `DATABASE_HOST` | PostgreSQL host | db |
| `DATABASE_PORT` | PostgreSQL port | 5432 |
| `DATABASE_USERNAME` | Database user | postgres |
| `DATABASE_PASSWORD` | Database password | postgres |
| `DATABASE_NAME` | Database name | context |
| `JWT_SECRET` | JWT signing key | (required) |
| `JWT_EXPIRATION_TIME` | Token expiration | 3h |
| `GROQ_API_KEY` | Groq API key | (required for AI) |

## Project Structure

```
src/
├── config/                 # App configuration
├── database/
│   ├── entities/          # TypeORM entities
│   └── migrations/        # Database migrations
├── modules/
│   ├── authentication/    # Auth module (JWT)
│   ├── health/           # Health checks
│   ├── llm/              # AI/LLM integration
│   ├── properties/
│   │   ├── property/     # Property CRUD
│   │   ├── propertyFeatures/  # AI-extracted features
│   │   └── propertyNotes/     # Notes with AI processing
│   └── users/            # User management
└── shared/               # Shared utilities
```

## Technical Decisions & Assumptions

### Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| **NestJS Framework** | Provides modular architecture, dependency injection, and excellent TypeScript support for scalable enterprise applications |
| **Event-Driven Processing** | Notes trigger async AI processing via EventEmitter2, keeping API responses fast while processing happens in background |
| **Soft Deletes** | All entities use `deletedAt` column to preserve data integrity and allow recovery |
| **Feature Aggregation** | Multiple notes per property are aggregated using majority voting (booleans) and averaging (numbers) to handle conflicting information |
| **Groq API (Llama 3.3 70B)** | Fast inference with structured JSON output support for reliable feature extraction |
| **AES-256-CBC Encryption** | Passwords encrypted with symmetric encryption for secure storage |

### Assumptions

- Properties are commercial real estate (office, warehouse, retail)
- Users write notes in English describing property characteristics
- AI feature extraction is best-effort; manual override is not implemented
- Score calculation treats all criteria with equal weight
- Properties without notes have no features (null feature record)

## API Examples

### Creating a Property Note

**Request:**
```bash
POST /property-notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "propertyId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "noteText": "Visited the property today. Great location near the L train subway station. Space needs some renovation but could fit about 45 people. Would work well as an office."
}
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "propertyId": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
  "userId": "de000000-0000-0000-0000-000000000001",
  "noteText": "Visited the property today...",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "user": {
    "id": "de000000-0000-0000-0000-000000000001",
    "name": "Demo User",
    "email": "demo@context.com"
  }
}
```

**AI-Extracted Features (async):**
```json
{
  "nearSubway": true,
  "needsRenovation": true,
  "estimatedCapacityPeople": 45,
  "recommendedUse": "office"
}
```

### AI-Powered Property Ranking

**Request:**
```bash
POST /properties/rank
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Looking for an office space in New York, near subway, budget under $1M, for a team of 50 people"
}
```

**Response:**
```json
[
  {
    "id": "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d",
    "title": "Modern Downtown Office Space",
    "city": "New York",
    "neighborhood": "Midtown Manhattan",
    "price": 850000,
    "areaM2": 250,
    "propertyType": "office",
    "feature": {
      "nearSubway": false,
      "needsRenovation": false,
      "estimatedCapacityPeople": 50,
      "recommendedUse": "office"
    },
    "score": 7
  },
  {
    "id": "d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a",
    "title": "Executive Office Suite",
    "city": "Boston",
    "neighborhood": "Back Bay",
    "price": 1100000,
    "areaM2": 300,
    "propertyType": "office",
    "feature": {
      "nearSubway": true,
      "needsRenovation": false,
      "estimatedCapacityPeople": 60,
      "recommendedUse": "office"
    },
    "score": 4
  }
]
```

**Score Breakdown:**
- Modern Downtown Office: 7/10 (matches: city, propertyType, price, capacity, recommendedUse; misses: nearSubway)
- Executive Office Suite: 4/10 (matches: propertyType, nearSubway, recommendedUse; misses: city, price)

## Limitations

| Limitation | Description |
|------------|-------------|
| **Single Instance EventEmitter** | Current event-driven architecture uses in-memory EventEmitter2, which doesn't scale horizontally across multiple instances |
| **No Retry Mechanism** | If LLM processing fails (API timeout, rate limit), the note's features are lost with no automatic retry |
| **Limited Feature Set** | Only 4 features are extracted; real estate has many more relevant attributes (parking, floor level, amenities, etc.) |
| **PropertyType vs RecommendedUse Conflict** | Both fields represent property usage, causing redundancy in scoring calculations |
| **No Feature Override** | Users cannot manually correct AI-extracted features if the LLM makes mistakes |
| **English Only** | AI prompts and extraction are optimized for English-language notes |
| **Memory-Intensive Ranking** | The `rankProperties` method loads all matching properties into memory before scoring, which can cause high memory usage with thousands of results |

## Future Improvements

### High Priority

1. **Message Queue Integration**
   - Replace EventEmitter2 with RabbitMQ or AWS SQS for horizontal scaling
   - Enable multiple API instances to process notes independently
   - Provides message persistence and delivery guarantees

2. **Failed Processing Recovery**
   - Implement a cron job to retry notes where `aiOutput` is null
   - Add `processingStatus` field: `pending`, `processing`, `completed`, `failed`
   - Create dead-letter queue for permanently failed items

3. **Expand Property Features**
   - Add more attributes: `hasParking`, `floorLevel`, `hasElevator`, `yearBuilt`, `amenities[]`
   - More features = better scoring precision and search filtering

4. **Streaming-Based Property Ranking**

   The current implementation loads all properties into memory:
   ```typescript
   // Current approach - memory intensive
   const properties = await query.getMany(); // Loads ALL results
   const scoredProperties = properties.map((property) => { ... });
   return scoredProperties.sort((a, b) => b.score - a.score);
   ```

   **Problem:** With 10,000+ properties, this consumes significant memory and can cause OOM errors.

   **Proposed Solution:** Use TypeORM streaming with batched processing:
   ```typescript
   async rankPropertiesStreaming(text: string): Promise<ResponsePropertyWithFeatureAndScore[]> {
     const BATCH_SIZE = 100;
     const scoredProperties: ResponsePropertyWithFeatureAndScore[] = [];

     // Use QueryBuilder stream for memory efficiency
     const stream = await query.stream();
     let batch: Property[] = [];

     for await (const rawProperty of stream) {
       const property = this.propertyRepository.create(rawProperty);
       batch.push(property);

       // Process in batches to limit memory
       if (batch.length >= BATCH_SIZE) {
         const scored = this.scoreBatch(batch, relevantFeatures, totalFields, propertyFields);
         scoredProperties.push(...scored);
         batch = []; // Clear batch, allow GC
       }
     }

     // Process remaining items
     if (batch.length > 0) {
       const scored = this.scoreBatch(batch, relevantFeatures, totalFields, propertyFields);
       scoredProperties.push(...scored);
     }

     // Sort only the final results
     return scoredProperties.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
   }

   private scoreBatch(
     batch: Property[],
     relevantFeatures: [string, any][],
     totalFields: number,
     propertyFields: number,
   ): ResponsePropertyWithFeatureAndScore[] {
     return batch.map((property) => {
       let matchCount = propertyFields;
       for (const [key, expectedValue] of relevantFeatures) {
         if (property.feature?.[key] === expectedValue) {
           matchCount++;
         }
       }
       const score = totalFields > 0 ? Math.round((matchCount / totalFields) * 10) : 0;
       return { ...property, score };
     });
   }
   ```

   **Benefits:**
   - Memory usage stays constant regardless of result size
   - Processes data as it arrives from database
   - Allows garbage collection between batches
   - Can handle millions of records without OOM

### Medium Priority

4. **Refactor Scoring System**
   - Remove `recommendedUse` from scoring (redundant with `propertyType`)
   - Add weighted scoring (location criteria more important than amenities)
   - Implement fuzzy matching for city names ("NYC" = "New York")

5. **Feature Override API**
   - Allow users to manually correct AI-extracted features
   - Track `source`: `ai` vs `manual` for each feature field

6. **Multi-language Support**
   - Detect note language and use appropriate LLM prompts
   - Support Spanish, Portuguese, and other common languages

### Nice to Have

7. **Real-time Updates**
   - WebSocket notifications when AI processing completes
   - Live score updates as new notes are added

8. **Analytics Dashboard**
   - Track LLM processing success rates
   - Monitor average processing time
   - Identify common extraction failures

## License

MIT
