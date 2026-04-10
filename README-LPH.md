# LPH Module — Implementation Notes

This document explains the extra features implemented in the `birth-death-growth-rates` module (`src/back/index-LPH.js` and the corresponding Svelte frontend page).

---

## 1. Deployment on Another Cloud (Hugging Face Spaces)

The app is deployed on two platforms:
- **Render:** https://sos2526-12.onrender.com (original)
- **Hugging Face Spaces:** https://lucperhea-sos2526-12.hf.space (second cloud, Docker-based)

A `Dockerfile` was created at the project root to support Back4App, since the Svelte frontend build output (`src/front/build/`) is gitignored and must be built at deploy time:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src/front/package*.json ./src/front/
RUN cd src/front && npm install
COPY src/front ./src/front
RUN cd src/front && npm run build
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]
```

**What it does step by step:**
1. Starts from a Node.js 20 image
2. Installs root dependencies (Express, NeDB, etc.)
3. Installs and builds the Svelte frontend
4. Copies the rest of the app
5. Starts the server on port 3000

---

## 2. GitHub OAuth (Backend)

OAuth is an authorization protocol that lets users log in using an existing account (GitHub in this case) without creating a new password.

**How it works:**
1. User clicks "Login" → redirected to GitHub
2. GitHub asks: "Do you allow this app to see your profile?"
3. User accepts → GitHub sends a code back to our app
4. Our app exchanges the code for the user's profile info
5. User is now logged in

**Packages used:**
- `passport` — authentication middleware for Express
- `passport-github2` — GitHub OAuth strategy for Passport
- `express-session` — stores the login state between requests (server-side session)

**Key code in `index-LPH.js`:**

```javascript
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, (accessToken, refreshToken, profile, done) => {
    // Log the login to the connections database
    connectionsDb.insert({ username: profile.username, timestamp: new Date().toISOString() });
    return done(null, profile);
}));
```

**Auth routes added:**
| Route | Purpose |
|-------|---------|
| `GET /auth/github` | Starts the GitHub login flow |
| `GET /auth/github/callback` | GitHub redirects here after login |
| `GET /auth/logout` | Destroys the session |
| `GET /auth/status` | Returns whether the user is logged in |
| `GET /api/v2/birth-death-growth-rates/connections` | Returns login history |

**Protecting routes:**

The `isAuthenticated` middleware checks if a request is authorized before allowing POST, PUT, or DELETE:

```javascript
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();         // valid session
    if (authHeader starts with "Bearer") {
        jwt.verify(token) → if valid, allow through   // valid JWT
    }
    return 401 Unauthorized;
}
```

---

## 3. JWT Authentication (Backend)

JWT (JSON Web Token) is a stateless authentication method. Instead of the server storing session data, all the user's info is encoded inside a self-contained token that the client holds.

**Think of it like a wristband at a concert:**
- You show ID at the door (login) → get a wristband (JWT)
- Every time you want a drink (do a protected action), show the wristband
- The wristband has an expiry date — no need to check the original ID again

**How it works in this project:**
1. User logs in (via Auth0)
2. Frontend receives a JWT from our backend (valid 24h)
3. JWT is stored in `localStorage` as `lph_jwt`
4. Every POST/PUT/DELETE request includes the header: `Authorization: Bearer <token>`
5. Backend verifies the token signature — if valid, the request goes through

**JWT structure:** Three base64url-encoded parts separated by dots:
```
header.payload.signature
```
The payload contains: `{ username, avatar, exp (expiry), iat (issued at) }`

**Endpoints added:**
| Route | Purpose |
|-------|---------|
| `GET /auth/jwt` | Issues a JWT for users logged in via GitHub session |
| `POST /auth/jwt-from-auth0` | Issues a JWT after verifying an Auth0 ID token |
| `GET /auth/test-token` | Issues a JWT without auth (only in non-production, used by tests) |

---

## 4. Auth0 with Social Login (Frontend)

Auth0 is a third-party identity platform that handles social login (GitHub, Google, etc.) through a hosted login page. This replaces the direct GitHub OAuth button on the frontend.

**How it works:**
1. User clicks "Iniciar sesión con Auth0" (orange button)
2. Redirected to Auth0's hosted login page
3. User picks a social provider (e.g. GitHub)
4. Auth0 handles the OAuth flow and redirects back to our page
5. Our page receives the Auth0 ID token, sends it to our backend
6. Backend decodes the ID token, issues our own JWT
7. JWT stored in `localStorage` — user can now do CRUD operations

**Package used:** `@auth0/auth0-spa-js`

**Key code in `+page.svelte`:**

```javascript
auth0Client = await createAuth0Client({
    domain: 'sos2526-12.eu.auth0.com',
    clientId: 'psixhrpR89WtLqsrPLJa8LvcxIV6zgBf',
    authorizationParams: { redirect_uri: window.location.href.split('?')[0] }
});

// Handle redirect callback when Auth0 sends user back
if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, window.location.pathname);
}
```

**Fast path (for tests and page re-visits):**

When the user navigates away and comes back, we don't want to go through the full Auth0 flow again. If a valid JWT is already in `localStorage`, we decode it and restore the session instantly:

```javascript
const base64 = existingToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
const payload = JSON.parse(atob(base64));
if (payload.exp * 1000 > Date.now()) {
    usuario = payload.username;
    return; // skip Auth0 entirely
}
```

Note: The `-/+` and `_//` replacements are needed because JWTs use base64url encoding, which `atob()` does not support natively.

---

## 5. Connection History

Every GitHub login is recorded in a separate NeDB database (`connections.db`):

```javascript
connectionsDb.insert({
    username: profile.username,
    displayName: profile.displayName,
    avatar: profile.photos?.[0]?.value,
    timestamp: new Date().toISOString()
});
```

View the history at:
```
GET /api/v2/birth-death-growth-rates/connections
```

---

## 6. Test Adaptations

### Newman/Postman tests (`test/api/api-test-LPH.json`)
Since POST/PUT/DELETE now require a JWT, the collection was updated to:
1. First request fetches a test JWT from `/auth/test-token`
2. Saves it as `{{jwt_token}}` collection variable
3. All protected requests include `Authorization: Bearer {{jwt_token}}`

### Playwright E2E tests (`tests/e2e/birth-death-growth-rates.spec.js`)
Auth0 can't be used in automated tests. The workaround:
1. `beforeAll` fetches a test JWT from `/auth/test-token`
2. `beforeEach` injects the JWT into `localStorage` via `addInitScript` before the page loads
3. The fast path in `initAuth()` detects the JWT and skips Auth0 entirely
4. The JWT is valid and accepted by the backend — tests run as if fully authenticated

---

## Environment Variables

| Variable | Purpose | Default (dev only) |
|----------|---------|-------------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App client ID | hardcoded dev value |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App secret | hardcoded dev value |
| `CALLBACK_URL` | GitHub OAuth callback URL | `http://localhost:3000/auth/github/callback` |
| `JWT_SECRET` | Secret used to sign JWTs | `sos2526-lph-jwt-secret` |
| `SESSION_SECRET` | Secret used to sign sessions | `sos2526-lph-secret` |

In production (Render, Hugging Face), these must be set as environment variables in the platform dashboard.

| `FIREBASE_SERVICE_ACCOUNT` | Base64-encoded Firebase service account JSON | not set (uses local key file) |

---

## 7. Firebase Parallel Persistence

Firestore (Firebase) runs **alongside** NeDB — every write is mirrored to Firestore in the background without blocking the API response. Reads still come from NeDB, so existing behaviour is unchanged.

**How it works:**
- Locally: reads the key file `sos2526-12-firebase-adminsdk-fbsvc-190658bab5.json` from the project root (gitignored)
- In production: reads from the `FIREBASE_SERVICE_ACCOUNT` env var (base64-encoded JSON)
- If neither is available, Firebase is silently skipped and NeDB handles everything

**Fire-and-forget helpers in `index-LPH.js`:**
```javascript
function fbSet(docId, data) {
    if (fbCollection) fbCollection.doc(docId).set(data).catch(e => console.warn(e.message));
}
function fbDelete(docId) {
    if (fbCollection) fbCollection.doc(docId).delete().catch(e => console.warn(e.message));
}
```

Every POST, PUT, DELETE and `loadInitialData` calls these after the NeDB operation succeeds. Document IDs use the composite key format: `${country_code}_${year}`.

---

## 8. Unit Tests and Code Coverage (Jest + Codecov)

Validation logic was extracted to `src/back/validate-LPH.js` and tested with Jest:

```
test/unit/validate-LPH.test.js   — 7 tests for birth-death-growth-rates validation
test/unit/validate-JJG.test.js   — 5 tests for mid-population-ages validation
test/unit/validate-FMG.test.js   — 6 tests for age-specific-fertility-rates validation
```

Run locally:
```bash
npm run test:unit
```

Coverage is uploaded to Codecov automatically in CI after every push.

---

## 9. Snyk Security Scanning

Snyk scans all npm dependencies for known vulnerabilities on every CI run. It is configured to only fail the pipeline on **critical** severity issues (not high), since some high-severity issues come from unmaintained packages (nedb) with no available fix.

Known issues (accepted):
- `nedb` — Prototype Pollution (no fix, unmaintained package)
- `express` path-to-regexp — ReDoS (high, not critical)
- `underscore` via nedb — Uncontrolled Recursion (no fix)
