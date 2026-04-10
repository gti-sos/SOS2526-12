import dataStore from 'nedb';
import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

let BASE_URL_API = "/api/v2";
let JWT_SECRET = process.env.JWT_SECRET || 'sos2526-lph-jwt-secret';
let db = new dataStore({ filename: 'birth-death-growth-rates.db', autoload: true });
let connectionsDb = new dataStore({ filename: 'connections.db', autoload: true });
let DOCS_URL_V1 = "https://documenter.getpostman.com/view/52398391/2sBXigLYdf";
let DOCS_URL_V2 = "https://documenter.getpostman.com/view/52398391/2sBXijJBsJ";

// Initialize Firebase (key file locally, env var in production)
const KEY_PATH = 'sos2526-12-firebase-adminsdk-fbsvc-190658bab5.json';
let fbCollection = null;
try {
    let serviceAccount;
    if (existsSync(KEY_PATH)) {
        serviceAccount = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString());
    }
    if (serviceAccount && !admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    }
    if (admin.apps.length) {
        fbCollection = admin.firestore().collection('birth-death-growth-rates');
    }
} catch (e) {
    console.warn('Firebase not available:', e.message);
}

// Fire-and-forget Firestore write — never blocks the NeDB response
function fbSet(docId, data) {
    if (fbCollection) fbCollection.doc(docId).set(data).catch(e => console.warn('Firebase set error:', e.message));
}
function fbDelete(docId) {
    if (fbCollection) fbCollection.doc(docId).delete().catch(e => console.warn('Firebase delete error:', e.message));
}
async function fbDeleteAll() {
    if (!fbCollection) return;
    try {
        const snapshot = await fbCollection.get();
        const batch = admin.firestore().batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    } catch (e) {
        console.warn('Firebase deleteAll error:', e.message);
    }
}

function isValidRecord(record) {
    if (!record.country_code || record.country_code === "") return false;
    if (!record.country_name || record.country_name === "") return false;
    if (record.year === undefined || record.year === null || record.year === "" || isNaN(record.year)) return false;
    return true;
}

// Configure GitHub OAuth strategy
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'Ov23liCCYPSTIv9iuB76',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '00d1d4d875b4b9d48117ec0bb7c11f647e5aead9',
    callbackURL: process.env.CALLBACK_URL || 'http://localhost:3000/auth/github/callback'
}, (accessToken, refreshToken, profile, done) => {
    // Log each login to the connections database
    connectionsDb.insert({
        username: profile.username,
        displayName: profile.displayName || profile.username,
        avatar: profile.photos?.[0]?.value || null,
        timestamp: new Date().toISOString()
    });
    return done(null, profile);
}));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Middleware to protect routes — returns 401 if not logged in
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    // Also accept a valid JWT in the Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            req.jwtUser = jwt.verify(token, JWT_SECRET);
            return next();
        } catch {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    }
    res.status(401).json({ message: "Unauthorized. Please login at /auth/github" });
}

const initialRecords = [
    { country_code: "SI", country_name: "Slovenia",         year: 2022, crude_birth_rate: 7.52,  crude_death_rate: 12.28, net_migration: 0.32,  rate_natural_increase: -0.476, growth_rate: -0.444 },
    { country_code: "LG", country_name: "Latvia",           year: 2022, crude_birth_rate: 8.70,  crude_death_rate: 14.73, net_migration: -5.71, rate_natural_increase: -0.603, growth_rate: -1.174 },
    { country_code: "MG", country_name: "Mongolia",         year: 2022, crude_birth_rate: 15.60, crude_death_rate: 6.36,  net_migration: -0.78, rate_natural_increase: 0.924,  growth_rate: 0.847  },
    { country_code: "MR", country_name: "Mauritania",       year: 2022, crude_birth_rate: 28.11, crude_death_rate: 7.29,  net_migration: -0.72, rate_natural_increase: 2.082,  growth_rate: 2.01   },
    { country_code: "LI", country_name: "Liberia",          year: 2022, crude_birth_rate: 30.92, crude_death_rate: 8.47,  net_migration: 0,     rate_natural_increase: 2.245,  growth_rate: 2.246  },
    { country_code: "TB", country_name: "Saint Barthelemy", year: 2022, crude_birth_rate: 9.31,  crude_death_rate: 9.45,  net_migration: -1.83, rate_natural_increase: -0.014, growth_rate: -0.197 },
    { country_code: "UP", country_name: "Ukraine",          year: 2022, crude_birth_rate: 9.16,  crude_death_rate: 13.82, net_migration: -0.26, rate_natural_increase: -0.466, growth_rate: -0.493 },
    { country_code: "CY", country_name: "Cyprus",           year: 2022, crude_birth_rate: 10.58, crude_death_rate: 7.18,  net_migration: 6.97,  rate_natural_increase: 0.34,   growth_rate: 1.037  },
    { country_code: "VE", country_name: "Venezuela",        year: 2022, crude_birth_rate: 17.32, crude_death_rate: 5.47,  net_migration: -1.1,  rate_natural_increase: 1.185,  growth_rate: 1.074  },
    { country_code: "ET", country_name: "Ethiopia",         year: 2022, crude_birth_rate: 34.37, crude_death_rate: 6.95,  net_migration: -0.18, rate_natural_increase: 2.742,  growth_rate: 2.724  },
    { country_code: "ZA", country_name: "Zambia",           year: 2022, crude_birth_rate: 39.74, crude_death_rate: 11.10, net_migration: 0,     rate_natural_increase: 2.864,  growth_rate: 2.864  },
    { country_code: "ET", country_name: "Ethiopia",         year: 2021, crude_birth_rate: 35.10, crude_death_rate: 7.20,  net_migration: -0.20, rate_natural_increase: 2.790,  growth_rate: 2.710  },
];

export function loadBackend(app) {

    // Session and passport middleware
    app.use(session({
        secret: process.env.SESSION_SECRET || 'sos2526-lph-secret',
        resave: false,
        saveUninitialized: false
    }));
    app.use(passport.initialize());
    app.use(passport.session());

    // --- Auth routes ---
    app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

    app.get('/auth/github/callback',
        passport.authenticate('github', { failureRedirect: '/auth/failure' }),
        (req, res) => res.redirect('/')
    );

    app.get('/auth/logout', (req, res) => {
        req.logout(() => res.json({ message: 'Logged out successfully' }));
    });

    app.get('/auth/status', (req, res) => {
        if (req.isAuthenticated()) {
            res.json({ authenticated: true, user: req.user.username, avatar: req.user.photos?.[0]?.value });
        } else {
            res.json({ authenticated: false });
        }
    });

    app.get('/auth/failure', (req, res) => {
        res.status(401).json({ message: 'GitHub authentication failed' });
    });

    // Test-only endpoint: issue a JWT without OAuth (disabled in production)
    if (process.env.NODE_ENV !== 'production') {
        app.get('/auth/test-token', (req, res) => {
            const token = jwt.sign(
                { username: 'playwright-test', avatar: null },
                JWT_SECRET,
                { expiresIn: '1h' }
            );
            res.json({ token });
        });
    }

    // Exchange an Auth0 ID token for our own backend JWT
    app.post('/auth/jwt-from-auth0', (req, res) => {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'ID token required' });
        try {
            // Decode the Auth0 ID token to extract user claims
            const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64').toString());
            if (!payload.sub) return res.status(401).json({ message: 'Invalid token' });
            const token = jwt.sign(
                { username: payload.nickname || payload.name || payload.email, avatar: payload.picture || null },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            res.json({ token });
        } catch {
            res.status(500).json({ message: 'Error processing token' });
        }
    });

    // Issue a JWT for the currently logged-in user (session must exist)
    app.get('/auth/jwt', (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: 'Not logged in. Go to /auth/github first.' });
        }
        const token = jwt.sign(
            { username: req.user.username, avatar: req.user.photos?.[0]?.value || null },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token });
    });

    // --- API routes ---
    app.get("/api/v1/birth-death-growth-rates/docs", (req, res) => {
        res.redirect(DOCS_URL_V1);
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates/docs", (req, res) => {
        res.redirect(DOCS_URL_V2);
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates/loadInitialData", (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            db.insert(initialRecords, (err, inserted) => {
                if (err) return res.status(500).json({ message: "Database error" });
                const clean = inserted.map(({ _id, ...rest }) => rest);
                // Mirror to Firestore
                fbDeleteAll().then(() => {
                    initialRecords.forEach(r => fbSet(`${r.country_code}_${r.year}`, r));
                });
                res.status(200).json(clean);
            });
        });
    });

    // Connection history — who has logged in and when
    app.get(BASE_URL_API + "/birth-death-growth-rates/connections", (req, res) => {
        connectionsDb.find({}, (err, records) => {
            if (err) return res.status(500).json({ message: "Database error" });
            const clean = records.map(({ _id, ...rest }) => rest);
            res.status(200).json(clean);
        });
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        const filters = req.query;
        const query = {};
        const operatorMap = { ">": "$gt", "<": "$lt", ">=": "$gte", "<=": "$lte" };
        const operators = [">=", "<=", ">", "<"];

        Object.keys(filters).forEach(key => {
            const value = filters[key];
            if (typeof value === "string" && /^\d+-\d+$/.test(value)) {
                const [min, max] = value.split("-");
                query[key] = { "$gte": Number(min), "$lte": Number(max) };
                return;
            }
            for (const op of operators) {
                if (value.startsWith(op)) {
                    const num = Number(value.slice(op.length));
                    if (!query[key]) query[key] = {};
                    query[key][operatorMap[op]] = num;
                    return;
                }
            }
            query[key] = isNaN(value) ? value : Number(value);
        });

        db.find(query, (err, records) => {
            const clean = records.map(({ _id, ...rest }) => rest);
            res.status(200).json(clean);
        });
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        const country_code = req.params.country_code;
        const year = parseInt(req.params.year);

        db.find({ country_code, year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }
            const { _id, ...clean } = records[0];
            res.status(200).json(clean);
        });
    });

    // POST, PUT, DELETE require authentication
    app.post(BASE_URL_API + "/birth-death-growth-rates", isAuthenticated, (req, res) => {
        const newRecord = req.body;

        if (!isValidRecord(newRecord)) {
            return res.status(400).json({ message: "Missing required fields: country_code, country_name, year" });
        }

        db.find({ country_code: newRecord.country_code, year: newRecord.year }, (err, records) => {
            if (records.length > 0) {
                return res.status(409).json({ message: "Record already exists" });
            }
            db.insert(newRecord, (err, inserted) => {
                if (err) return res.status(500).json({ message: "Database error" });
                const { _id, ...clean } = inserted;
                // Mirror to Firestore
                fbSet(`${clean.country_code}_${clean.year}`, clean);
                res.status(201).json(clean);
            });
        });
    });

    app.post(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    app.put(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", isAuthenticated, (req, res) => {
        const country_code = req.params.country_code;
        const year = Number(req.params.year);
        const updatedRecord = req.body;

        if (!isValidRecord(updatedRecord)) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (updatedRecord.country_code !== country_code || Number(updatedRecord.year) !== year) {
            return res.status(400).json({ message: "country_code and year in body must match the URL" });
        }

        db.find({ country_code, year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }
            const { _id } = records[0];
            db.update({ _id }, { $set: updatedRecord }, {}, (err) => {
                if (err) return res.status(500).json({ message: "Database error" });
                // Mirror to Firestore
                fbSet(`${country_code}_${year}`, updatedRecord);
                res.status(200).json(updatedRecord);
            });
        });
    });

    app.put(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    app.delete(BASE_URL_API + "/birth-death-growth-rates", isAuthenticated, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            // Mirror to Firestore
            fbDeleteAll();
            res.status(200).json({ message: "All records deleted successfully" });
        });
    });

    app.delete(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", isAuthenticated, (req, res) => {
        const country_code = req.params.country_code;
        const year = Number(req.params.year);

        db.find({ country_code, year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }
            db.remove({ country_code, year }, {}, (err) => {
                if (err) return res.status(500).json({ message: "Database error" });
                // Mirror to Firestore
                fbDelete(`${country_code}_${year}`);
                res.status(200).json({ message: "Record deleted successfully" });
            });
        });
    });
}
