# Startup News Room — Backend API

Express 5 + MongoDB (Mongoose) + TypeScript (strict) backend for **Startup News Room**,
a startup news platform that publishes daily headlines.

## 1. Setup

```bash
git clone <repo> && cd startup-news-room-api
npm install
cp .env.example .env      # then fill in the values
npm run dev
MongoDB Atlas
Create a free cluster at https://cloud.mongodb.com

Create a database user and allow your IP (or 0.0.0.0/0 for dev).

Copy the connection string into MONGODB_URI (append a database name, e.g. /startup-news-room).

Cloudinary
Sign up at https://cloudinary.com

Copy Cloud name, API Key, API Secret into .env.

JWT secrets
Generate two long random strings, e.g.:

bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
2. Environment variables
Variable	Required	Description
NODE_ENV	no	development | test | production (default development)
PORT	no	HTTP port (default 4000)
MONGODB_URI	yes	MongoDB connection string
CLIENT_ORIGINS	yes	Comma-separated CORS allowlist
JWT_ACCESS_SECRET	yes	32+ chars, signs 15-minute access tokens
JWT_REFRESH_SECRET	yes	32+ chars, signs 7-day refresh tokens
COOKIE_SAMESITE	no	lax (default) or none (cross-site, requires HTTPS)
CLOUDINARY_CLOUD_NAME	yes	Cloudinary cloud name
CLOUDINARY_API_KEY	yes	Cloudinary API key
CLOUDINARY_API_SECRET	yes	Cloudinary API secret
ADMIN_NAME	yes	Seed admin display name
ADMIN_EMAIL	yes	Seed admin email
ADMIN_PASSWORD	yes	Seed admin password (min 10 chars)
TRUST_PROXY	no	Express trust proxy value (1, true, loopback, …)
3. Commands
bash
npm run dev         # tsx watch
npm run build       # compile to dist/
npm run start       # run the compiled build
npm run seed        # idempotent: categories + admin + 24 fictional stories
npm run test        # vitest + supertest + mongodb-memory-server
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
4. Endpoints
Public (no auth)
Method	Path	Description
GET	/api/v1/health	Service status + DB connection state
GET	/api/v1/stories	List public stories (category, q, page, limit, date)
GET	/api/v1/stories/featured	Latest featured story (falls back to newest)
GET	/api/v1/stories/top	5 newest stories excluding the featured one
GET	/api/v1/stories/breaking	Latest 8 breaking stories
GET	/api/v1/stories/:slug	Single story by slug
GET	/api/v1/stories/:slug/related	4 related stories
GET	/api/v1/categories	Categories with public story counts
POST	/api/v1/newsletter/subscribe	Subscribe (idempotent)
GET	/api/v1/newsletter/unsubscribe?token=	Unsubscribe
POST	/api/v1/contact	Contact / tip (honeypot protected)
Auth
Method	Path	Auth	Description
POST	/api/v1/auth/login	—	Returns access token + sets refresh cookie
POST	/api/v1/auth/refresh	cookie	New access token
POST	/api/v1/auth/logout	Bearer	Revokes refresh token (bumps tokenVersion)
GET	/api/v1/auth/me	Bearer	Current user
Admin (auth required; editors and admins unless noted)
Method	Path	Description
GET	/api/v1/admin/stories	All stories, any status
POST	/api/v1/admin/stories	Create story
PATCH	/api/v1/admin/stories/:id	Partial update
DELETE	/api/v1/admin/stories/:id	Delete (admin only)
POST	/api/v1/admin/uploads/image	Upload image (image field, ≤5 MB)
POST	/api/v1/admin/link-preview	OG metadata extractor (SSRF-safe)
GET	/api/v1/admin/categories	List categories
POST	/api/v1/admin/categories	Create category
PATCH	/api/v1/admin/categories/:id	Update category
DELETE	/api/v1/admin/categories/:id	Delete (admin only, refuses if in use)
GET	/api/v1/admin/messages	List messages
PATCH	/api/v1/admin/messages/:id	Mark read
GET	/api/v1/admin/subscribers	List subscribers (?format=csv, admin only)
5. Response formats
jsonc
// Single / array
{ "data": { } }
{ "data": [ ] }

// Paginated
{ "data": [ ], "pagination": { "page": 1, "limit": 9, "total": 42, "totalPages": 5, "hasMore": true } }

// Error
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [ ] } }
6. curl examples
Login
bash
curl -i -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@startupnewsroom.com","password":"ChangeMe12345"}'
Create a story
bash
curl -X POST http://localhost:4000/api/v1/admin/stories \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "title": "Acme Robotics Raises a $20M Series B to Automate Warehouses",
    "summary": "The company plans to triple its deployment footprint across Europe over the next twelve months.",
    "content": "Acme Robotics announced today...",
    "imageUrl": "https://images.example.com/acme.jpg",
    "imageCredit": "Acme Robotics press kit",
    "sourceName": "Example Wire",
    "sourceUrl": "https://example.com/news/acme-series-b",
    "category": "funding",
    "tags": ["funding", "robotics", "series-b"],
    "status": "published",
    "isFeatured": true
  }'
List stories
bash
curl 'http://localhost:4000/api/v1/stories?category=funding&page=1&limit=9'
curl 'http://localhost:4000/api/v1/stories?q=robotics'
curl 'http://localhost:4000/api/v1/stories?date=2025-01-15'
7. Architecture notes
Layering: routes → controllers → services → models. No business logic in routes.

Single visibility rule: publicStoryFilter() in services/story.service.ts is the only place the public visibility rule (status: "published" and publishedAt <= now) is expressed.

Public projection: public endpoints select an explicit field list — status, createdBy and internal fields are never returned.

Slug stability: slugs are generated once (with a nanoid suffix on conflict) and the schema field is immutable: true.

Featured uniqueness: enforced both by a pre-save hook and by the isFeatured index.

Validation: every body, query and param passes through zod with .strict(), which rejects unknown fields and therefore NoSQL operator injection ({"$gt": ""} is a non-string and is rejected).

Link preview SSRF guard: protocol allowlist, DNS resolution with private/loopback/link-local/metadata rejection, redirect revalidation (max 3), 5 s timeout, 1 MB body cap, text/html only.

Storage abstraction: StorageService interface in services/storage.service.ts so Cloudinary can be swapped out later.