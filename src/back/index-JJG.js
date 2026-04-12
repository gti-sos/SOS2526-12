import dataStore from 'nedb';
import jwt from 'jsonwebtoken';
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';

let BASE_URL_API = "/api/v2";

// === TU SECRETO ÚNICO (No compartido) ===
let JWT_SECRET = process.env.JWT_SECRET || 'sos2526-jjg-secret-unique'; 

let db = new dataStore();
let DOCS_URL = "https://documenter.getpostman.com/view/52368982/2sBXigMtBS"; 

// ==========================================
// CONFIGURACIÓN FIREBASE (Tu persistencia)
// ==========================================
const KEY_PATH = 'sos2526-12-jjg-firebase-adminsdk-fbsvc-47e15de4ef.json';
let fbCollection = null;

try {
    let serviceAccount;
    if (existsSync(KEY_PATH)) {
        serviceAccount = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    if (serviceAccount && !admin.apps.length) {
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        console.log('Firebase initialized successfully (JJG)');
    }
    if (admin.apps.length) {
        fbCollection = admin.firestore().collection('mid-population-ages');
    }
} catch (e) {
    console.warn('Firebase not available:', e.message);
}

// Funciones espejo para Firebase
function fbSet(docId, data) {
    if (fbCollection) fbCollection.doc(docId).set(data).catch(e => console.warn('Firebase error:', e.message));
}
function fbDelete(docId) {
    if (fbCollection) fbCollection.doc(docId).delete().catch(e => console.warn('Firebase error:', e.message));
}
async function fbDeleteAll() {
    if (!fbCollection) return;
    const snapshot = await fbCollection.get();
    const batch = admin.firestore().batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
}

// ==========================================
// MIDDLEWARE HÍBRIDO (Reforzado con Logs)
// ==========================================
function isAuthenticated(req, res, next) {
    console.log(`[JJG Auth] Verificando ruta: ${req.method} ${req.url}`);
    
    // Verificación por Token Bearer (Auth0)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            // Validamos con TU JWT_SECRET
            const decoded = jwt.verify(token, JWT_SECRET);
            req.jwtUser = decoded;
            console.log(`[JJG Auth] ✅ Token válido para: ${decoded.username}`);
            return next();
        } catch (err) {
            console.error(`[JJG Auth] ❌ Error verificando token: ${err.message}`);
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    }
    
    // Si no hay token en el header, probamos si ya está autenticado por sesión (Passport)
    if (req.isAuthenticated && req.isAuthenticated()) {
        console.log("[JJG Auth] ✅ Usuario autenticado por sesión");
        return next();
    }

    console.warn("[JJG Auth] ⚠️ Intento de acceso sin token válido");
    res.status(401).json({ message: "Unauthorized. Please login with Auth0." });
}

export function loadBackend(app) {

    // ==========================================
    // RUTA DE INTERCAMBIO (Estructura compañero / Tu Secreto)
    // ==========================================
    app.post("/auth/jwt-from-auth0", (req, res) => {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ message: 'ID token required' });
        
        try {
            // Decodificamos el idToken de TU Auth0 para sacar TU nombre real (base64url safe)
            const base64Payload = idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            
            // Creamos TU token firmado con TU secreto
            const token = jwt.sign(
                { 
                    username: payload.nickname || payload.name || "Usuario_JJG",
                    avatar: payload.picture || null 
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            console.log(`✅ JWT propio generado para: ${payload.name || payload.nickname}`);
            res.json({ token });
        } catch (e) {
            res.status(500).json({ message: 'Error processing token' });
        }
    });

    // ==========================================
    // TUS RUTAS API (Sin cambios en la lógica)
    // ==========================================
    let initialRecords = [
        { country_code: "AF", country_name: "Afghanistan", year: 1979, sex: "Male", max_age: 100, population_age_0: 318425, population_age_25: 127876, population_age_50: 49804, population_age_75: 9729, population_age_100: 2 },
        { country_code: "AJ", country_name: "Azerbaijan", year: 1992, sex: "Female", max_age: 100, population_age_0: 108912, population_age_25: 67871, population_age_50: 31250, population_age_75: 4571, population_age_100: 3 },
        { country_code: "AJ", country_name: "Azerbaijan", year: 1990, sex: "Female", max_age: 100, population_age_0: 107574, population_age_25: 68932, population_age_50: 31252, population_age_75: 4594, population_age_100: 8 },
        { country_code: "AM", country_name: "Armenia", year: 1991, sex: "Female", max_age: 100, population_age_0: 37961, population_age_25: 31179, population_age_50: 19315, population_age_75: 4571, population_age_100: 37 },
        { country_code: "AN", country_name: "Andorra", year: 1991, sex: "Female", max_age: 100, population_age_0: 37961, population_age_25: 31179, population_age_50: 19315, population_age_75: 4571, population_age_100: 37 },
        { country_code: "AS", country_name: "Australia", year: 1986, sex: "Male", max_age: 100, population_age_0: 121872, population_age_25: 1367731, population_age_50: 76764, population_age_75: 32582, population_age_100: 163 },
        { country_code: "BA", country_name: "Bahrain", year: 1982, sex: "Male", max_age: 96, population_age_0: 5313, population_age_25: 6093, population_age_50: 1394, population_age_75: 168, population_age_100: 0 },
        { country_code: "BC", country_name: "Botswana", year: 1983, sex: "Male", max_age: 100, population_age_0: 20539, population_age_25: 6321, population_age_50: 2624, population_age_75: 991, population_age_100: 3 },
        { country_code: "BD", country_name: "Bermuda", year: 1992, sex: "Male", max_age: 99, population_age_0: 427, population_age_25: 506, population_age_50: 324, population_age_75: 100, population_age_100: 0 },
        { country_code: "BF", country_name: "Bahamas The", year: 1980, sex: "Male", max_age: 96, population_age_0: 2574, population_age_25: 17171, population_age_50: 628, population_age_75: 149, population_age_100: 0 }
    ];

    app.get(BASE_URL_API + "/mid-population-ages/loadInitialData", (req, res) => {
        db.remove({}, { multi: true }, () => {
            db.insert(initialRecords, (err, newDocs) => {
                fbDeleteAll().then(() => {
                    initialRecords.forEach(r => fbSet(`${r.country_name}_${r.year}_${r.sex}`, r));
                });
                res.status(201).json(newDocs.map(({ _id, ...rest }) => rest));
            });
        });
    });

    app.get(BASE_URL_API + "/mid-population-ages", (req, res) => {
        let query = {};
        if (req.query.country_name) query.country_name = req.query.country_name;
        
        // Soporte para filtrado por año (simple o rango)
        if (req.query.year) {
            const y = req.query.year;
            if (y.includes("-")) {
                const [from, to] = y.split("-").map(n => parseInt(n));
                query.year = { $gte: from, $lte: to };
            } else if (y.startsWith(">=")) {
                query.year = { $gte: parseInt(y.slice(2)) };
            } else if (y.startsWith("<=")) {
                query.year = { $lte: parseInt(y.slice(2)) };
            } else {
                query.year = parseInt(y);
            }
        }

        db.find(query, (err, records) => {
            res.status(200).json(records.map(({ _id, ...rest }) => rest));
        });
    });

    // 5. POST (Protegido)
    app.post(BASE_URL_API + "/mid-population-ages", isAuthenticated, (req, res) => {
        const newData = req.body;
        if (!newData.country_name || !newData.year || !newData.sex) {
            return res.status(400).send("Faltan campos obligatorios");
        }
        
        db.findOne({ country_name: newData.country_name, year: newData.year, sex: newData.sex }, (err, doc) => {
            if (doc) return res.status(409).send("Ya existe el registro");
            db.insert(newData, (err, newDoc) => {
                fbSet(`${newData.country_name}_${newData.year}_${newData.sex}`, newData);
                res.status(201).json(newDoc);
            });
        });
    });

    // 6. GET ONE
    app.get(BASE_URL_API + "/mid-population-ages/:country_name/:year/:sex", (req, res) => {
        const { country_name, year, sex } = req.params;
        db.findOne({ country_name, year: parseInt(year), sex }, (err, record) => {
            if (!record) return res.status(404).send("Not found");
            const { _id, ...rest } = record;
            res.status(200).json(rest);
        });
    });

    // 7. PUT (Protegido)
    app.put(BASE_URL_API + "/mid-population-ages/:country_name/:year/:sex", isAuthenticated, (req, res) => {
        const { country_name, year, sex } = req.params;
        const updatedData = req.body;

        if (country_name !== updatedData.country_name || parseInt(year) !== updatedData.year || sex !== updatedData.sex) {
            return res.status(400).send("Los campos clave no coinciden con la URL");
        }

        db.update({ country_name, year: parseInt(year), sex }, { $set: updatedData }, {}, (err, num) => {
            if (num === 0) return res.status(404).send("Not found");
            fbSet(`${country_name}_${year}_${sex}`, updatedData);
            res.status(200).send("Updated");
        });
    });

    // 8. DELETE ALL (Protegido)
    app.delete(BASE_URL_API + "/mid-population-ages", isAuthenticated, (req, res) => {
        console.log("[JJG API] Petición para vaciar toda la tabla");
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) {
                console.error("[JJG API] Error al vaciar NeDB:", err);
                return res.status(500).send("Error en la base de datos");
            }
            fbDeleteAll().then(() => {
                console.log(`[JJG API] ✅ Tabla vaciada (${numRemoved} registros)`);
                res.status(200).json({ message: `Deleted all (${numRemoved} records)` });
            }).catch(e => {
                console.error("[JJG API] Error al vaciar Firebase:", e);
                res.status(500).send("Error al vaciar persistencia externa");
            });
        });
    });

    // 9. DELETE ONE (Protegido)
    app.delete(BASE_URL_API + "/mid-population-ages/:country_name/:year/:sex", isAuthenticated, (req, res) => {
        const { country_name, year, sex } = req.params;
        db.remove({ country_name, year: parseInt(year), sex }, {}, (err, num) => {
            if (num === 0) return res.status(404).send("Not found");
            fbDelete(`${country_name}_${year}_${sex}`);
            res.status(200).send("Deleted");
        });
    });
}