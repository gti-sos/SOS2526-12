import dataStore from 'nedb';


let BASE_URL_API = "/api/v2";
let db = new dataStore({ filename: 'mid-population-ages.db', autoload: true });

// --- AQUÍ DEFINIMOS LOS DOS ENLACES ---
let DOCS_URL_V1 = "https://documenter.getpostman.com/view/52368982/2sBXqJKLmr"; 
let DOCS_URL_V2 = "https://documenter.getpostman.com/view/52368982/2sBXigMtBS"; 

export function loadBackend(app) {

    let initialRecords = [
        { country_code: "AF", country_name: "Afghanistan", year: 1979, sex: "Male", max_age: 87, population_age_0: 4215, population_age_25: 8764, population_age_50: 4921, population_age_75: 2150, population_age_100: 12 },
        { country_code: "AJ", country_name: "Azerbaijan", year: 1992, sex: "Female", max_age: 92, population_age_0: 3891, population_age_25: 6543, population_age_50: 7210, population_age_75: 1934, population_age_100: 27 },
        { country_code: "AJ", country_name: "Azerbaijan", year: 1990, sex: "Female", max_age: 95, population_age_0: 4782, population_age_25: 6893, population_age_50: 5120, population_age_75: 2204, population_age_100: 33 },
        { country_code: "AM", country_name: "Armenia", year: 1991, sex: "Female", max_age: 91, population_age_0: 6421, population_age_25: 3117, population_age_50: 7891, population_age_75: 2870, population_age_100: 54 },
        { country_code: "AN", country_name: "Andorra", year: 1991, sex: "Female", max_age: 88, population_age_0: 5932, population_age_25: 4120, population_age_50: 6745, population_age_75: 2987, population_age_100: 41 },
        { country_code: "AS", country_name: "Australia", year: 1986, sex: "Male", max_age: 99, population_age_0: 8721, population_age_25: 6345, population_age_50: 9987, population_age_75: 5421, population_age_100: 96 },
        { country_code: "BA", country_name: "Bahrain", year: 1982, sex: "Male", max_age: 96, population_age_0: 5313, population_age_25: 6093, population_age_50: 1394, population_age_75: 168, population_age_100: 0 },
        { country_code: "BC", country_name: "Botswana", year: 1983, sex: "Male", max_age: 93, population_age_0: 7542, population_age_25: 6321, population_age_50: 2624, population_age_75: 991, population_age_100: 8 },
        { country_code: "BD", country_name: "Bermuda", year: 1992, sex: "Male", max_age: 99, population_age_0: 427, population_age_25: 506, population_age_50: 324, population_age_75: 100, population_age_100: 0 },
        { country_code: "BF", country_name: "Bahamas The", year: 1980, sex: "Male", max_age: 96, population_age_0: 2574, population_age_25: 8171, population_age_50: 628, population_age_75: 149, population_age_100: 0 },
        { country_code: "AU", country_name: "Australia", year: 2022, sex: "Male", max_age: 100, population_age_0: 1543, population_age_25: 1825, population_age_50: 6400, population_age_75: 9100, population_age_100: 150 },
        { country_code: "JP", country_name: "Japan", year: 2022, sex: "Female", max_age: 98, population_age_0: 4102, population_age_25: 5601, population_age_50: 8300, population_age_75: 6500, population_age_100: 4200 },
        { country_code: "ES", country_name: "Spain", year: 2022, sex: "Male", max_age: 100, population_age_0: 2100, population_age_25: 3500, population_age_50: 8200, population_age_75: 5400, population_age_100: 4500 },
        { country_code: "ES", country_name: "Spain", year: 2022, sex: "Female", max_age: 100, population_age_0: 2050, population_age_25: 3050, population_age_50: 9500, population_age_75: 6800, population_age_100: 4000 },
        { country_code: "IT", country_name: "Italy", year: 2022, sex: "Male", max_age: 97, population_age_0: 4500, population_age_25: 3420, population_age_50: 7100, population_age_75: 8200, population_age_100: 3800 },
        { country_code: "IT", country_name: "Italy", year: 2022, sex: "Female", max_age: 99, population_age_0: 3200, population_age_25: 3310, population_age_50: 7500, population_age_75: 9300, population_age_100: 5500 }
    ];
    
    // ==========================================
    // 1. CARGA DE DATOS INICIALES (Versión Forzada)
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages/loadInitialData", (req, res) => {
        db.count({}, (err, count) => {
            if (err) return res.status(500).json({ message: "Error al consultar la base de datos" });
            if (count > 0) {
                return res.status(200).json({ message: `Ya hay ${count} registros, no se sobrescribe` });
            }
            db.insert(initialRecords, (err, newDocs) => {
                if (err) {
                    console.error(" Error al insertar:", err);
                    return res.status(500).json({ message: "Error al insertar datos" });
                }
                console.log(`✅ Base de datos cargada. ${newDocs.length} registros iniciales.`);
                res.status(201).json(newDocs.map(({ _id, ...rest }) => rest));
            });
        });
    });

    // ==========================================
    // 2. GET A LA COLECCIÓN (Búsqueda y Paginación)
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages", (req, res) => {
        let query = {};
        let offset = 0;
        let limit = Number.MAX_SAFE_INTEGER;

        // Paginación
        if (req.query.offset) offset = parseInt(req.query.offset);
        if (req.query.limit) limit = parseInt(req.query.limit);

        // Búsqueda por país (Ignorando mayúsculas y minúsculas, escapando caracteres regex)
        if (req.query.country_name) {
            const escaped = String(req.query.country_name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query.country_name = new RegExp(escaped, "i");
        }
        if (req.query.country_code) {
            query.country_code = req.query.country_code;
        }

        // Búsqueda por años (Exacto o Rango From/To)
        if (req.query.year) {
            // Si viene un rango separado por guion (ej: "1990-2020")
            if (typeof req.query.year === "string" && req.query.year.includes("-")) {
                const [min, max] = req.query.year.split("-");
                query.year = {};
                if (min) query.year.$gte = parseInt(min);
                if (max) query.year.$lte = parseInt(max);
            } 
            // Si viene el símbolo >= (ej: ">=1990")
            else if (typeof req.query.year === "string" && req.query.year.startsWith(">=")) {
                query.year = { $gte: parseInt(req.query.year.replace(">=", "")) };
            }
            // Si viene el símbolo <= (ej: "<=2020")
            else if (typeof req.query.year === "string" && req.query.year.startsWith("<=")) {
                query.year = { $lte: parseInt(req.query.year.replace("<=", "")) };
            }
            // Si es un año exacto normal
            else {
                query.year = parseInt(req.query.year);
            }
        } 
        
        else if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = parseInt(req.query.from);
            if (req.query.to) query.year.$lte = parseInt(req.query.to);
        }

        // Búsqueda por sexo (exacto)
        if (req.query.sex) {
            query.sex = req.query.sex;
        }

        // Búsqueda por campos numéricos (=, >=, <=, "min-max")
        const numericFields = ['max_age', 'population_age_0', 'population_age_25', 'population_age_50', 'population_age_75', 'population_age_100'];
        numericFields.forEach(field => {
            const value = req.query[field];
            if (value === undefined) return;
            if (typeof value === "string" && /^\d+-\d+$/.test(value)) {
                const [min, max] = value.split("-");
                query[field] = { $gte: parseInt(min), $lte: parseInt(max) };
            } else if (typeof value === "string" && value.startsWith(">=")) {
                query[field] = { $gte: parseInt(value.slice(2)) };
            } else if (typeof value === "string" && value.startsWith("<=")) {
                query[field] = { $lte: parseInt(value.slice(2)) };
            } else {
                query[field] = parseInt(value);
            }
        });

        db.find(query).skip(offset).limit(limit).exec((err, records) => {
            if (err) return res.status(500).json({ message: "Error en la base de datos" });
            const cleanRecords = records.map(({ _id, ...rest }) => rest);
            res.status(200).json(cleanRecords);
        });
    });

    // ==========================================
    // 3. GET A RECURSO CONCRETO (Objeto)
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages/:country_name/:year/:sex", (req, res) => {
        const country_name = req.params.country_name;
        const year = parseInt(req.params.year);
        const sex = req.params.sex;

        db.find({ country_name, year, sex }, (err, records) => {
            if (err) return res.status(500).json({ message: "Error interno" });
            if (records.length === 0) return res.status(404).json({ message: "Recurso no encontrado" });
            
            const { _id, ...cleanRecord } = records[0];
            res.status(200).json(cleanRecord);
        });
    });

    // ==========================================
    // 4. POST A LA COLECCIÓN
    // ==========================================
    app.post(BASE_URL_API + "/mid-population-ages", (req, res) => {
        const newRecord = req.body;
        if (newRecord._id) delete newRecord._id;

        const expectedFields = [
            "country_code", "country_name", "year", "sex", "max_age", 
            "population_age_0", "population_age_25", "population_age_50", 
            "population_age_75", "population_age_100"
        ];
        const receivedFields = Object.keys(newRecord);
        const hasAllFields = expectedFields.every(field => receivedFields.includes(field));
        const hasExtraFields = receivedFields.length > expectedFields.length;

        if (!hasAllFields || hasExtraFields) {
            return res.status(400).json({ message: "Bad request. La estructura JSON debe tener exactamente los 10 campos esperados." });
        }

        db.find({ country_name: newRecord.country_name, year: newRecord.year, sex: newRecord.sex }, (err, records) => {
            if (err) return res.status(500).json({ message: "Error interno" });
            if (records.length > 0) return res.status(409).json({ message: "Conflicto: El recurso ya existe" });
            
            db.insert(newRecord, (err, insertedDoc) => {
                if (err) {
                    console.error(" Error de NeDB en el POST:", err);
                    return res.status(500).json({ message: "Error interno" });
                }
                const { _id, ...cleanDoc } = insertedDoc;
                res.status(201).json(cleanDoc);
            });
        });
    });

    // ==========================================
    // 5. POST A RECURSO CONCRETO (No permitido)
    // ==========================================
    app.post(BASE_URL_API + "/mid-population-ages/:country_name/:year/:sex", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    // ==========================================
    // 6. PUT A RECURSO CONCRETO
    // ==========================================
    app.put(BASE_URL_API + "/mid-population-ages/:country_name/:year/:sex", (req, res) => {
        const country_name = req.params.country_name;
        const year = parseInt(req.params.year);
        const sex = req.params.sex;
        const updatedRecord = req.body;

        if (updatedRecord._id) delete updatedRecord._id;

        const expectedFields = [
            "country_code", "country_name", "year", "sex", "max_age", 
            "population_age_0", "population_age_25", "population_age_50", 
            "population_age_75", "population_age_100"
        ];
        const receivedFields = Object.keys(updatedRecord);
        const hasAllFields = expectedFields.every(field => receivedFields.includes(field));
        const hasExtraFields = receivedFields.length > expectedFields.length;

        if (!hasAllFields || hasExtraFields) {
            return res.status(400).json({ message: "Bad request. La estructura JSON debe tener exactamente los 10 campos esperados." });
        }

        if (updatedRecord.country_name !== country_name || updatedRecord.year !== year || updatedRecord.sex !== sex) {
            return res.status(400).json({ message: "Los parámetros del ID en la URL deben coincidir con el body" });
        }

        db.update({ country_name, year, sex }, updatedRecord, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ message: "Error interno" });
            if (numReplaced === 0) return res.status(404).json({ message: "Recurso no encontrado" });
            res.status(200).json(updatedRecord);
        });
    });

    // ==========================================
    // 7. PUT A LA COLECCIÓN (No permitido)
    // ==========================================
    app.put(BASE_URL_API + "/mid-population-ages", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    // ==========================================
    // 8. DELETE A LA COLECCIÓN
    // ==========================================
    app.delete(BASE_URL_API + "/mid-population-ages", (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ message: "Error interno" });
            res.status(200).json({ message: `Se han borrado todos los registros (${numRemoved})` });
        });
    });

    // ==========================================
    // 9. DELETE A RECURSO CONCRETO
    // ==========================================
    app.delete(BASE_URL_API + "/mid-population-ages/:country_name/:year/:sex", (req, res) => {
        const country_name = req.params.country_name;
        const year = parseInt(req.params.year);
        const sex = req.params.sex;

        db.remove({ country_name, year, sex }, {}, (err, numRemoved) => {
            if (err) return res.status(500).json({ message: "Error interno" });
            if (numRemoved === 0) return res.status(404).json({ message: "Recurso no encontrado" });
            res.status(200).json({ message: "Recurso borrado correctamente" });
        });
    });

    // ==========================================
    // 10. REDIRECCIÓN A DOCS (Postman) - V1
    // ==========================================
    app.get("/api/v1/mid-population-ages/docs", (req, res) => {
        res.redirect(DOCS_URL_V1);
    });

    // ==========================================
    // 11. REDIRECCIÓN A DOCS (Postman) - V2
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages/docs", (req, res) => {
        res.redirect(DOCS_URL_V2);
    });


    // ==========================================
    // 12. PROXY PARA INTEGRACIÓN EXTERNA (D03.B)
    // disease.sh — estadísticas globales por país, incluye población.
    // ==========================================
    app.get(BASE_URL_API + "/proxy/disease-stats", async (req, res) => {
        try {
            const urlExterna = "https://disease.sh/v3/covid-19/countries";

            const response = await fetch(urlExterna);

            if (!response.ok) {
                return res.status(response.status).json({ message: "Error al acceder a la API externa" });
            }

            const data = await response.json();

            res.status(200).json(data);

        } catch (error) {
            console.error("Error en el proxy:", error);
            res.status(500).json({ message: "Error interno del servidor en el proxy" });
        }
    });
}
