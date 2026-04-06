import dataStore from 'nedb';

let BASE_URL_API = "/api/v2";
let db = new dataStore();
let DOCS_URL = "https://documenter.getpostman.com/view/52368982/2sBXigMtBS"; 

export function loadBackend(app) {

    // Datos iniciales de tu ficha de trabajo (10 campos)
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
    
    // ==========================================
    // 1. CARGA DE DATOS INICIALES
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages/loadInitialData", (req, res) => {
        db.find({}, (err, records) => {
            if (err) return res.status(500).json({ message: "Error interno de la base de datos" });
            
            if (records.length === 0) {
                db.insert(initialRecords, (err, newDocs) => {
                    if (err) {
                        console.error(" Error de NeDB al insertar:", err);
                        return res.status(500).json({ message: "Error al insertar datos" });
                    }
                    console.log(`Cargados ${newDocs.length} registros iniciales.`);
                    res.status(201).json(newDocs.map(({ _id, ...rest }) => rest)); 
                });
            } else {
                res.status(200).json({ message: "Los datos ya estaban cargados previamente" });
            }
        });
    });

    // ==========================================
    // 2. GET A LA COLECCIÓN (Búsqueda y Paginación)
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages", (req, res) => {
        const query = {};
        
        let offset = 0;
        let limit = Number.MAX_SAFE_INTEGER;

        if (req.query.offset) {
            offset = parseInt(req.query.offset);
            delete req.query.offset;
        }
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
            delete req.query.limit;
        }

        // --- NUEVO FILTRO DE RANGO DE AÑOS PARA NEDB ---
        if (req.query.start_year || req.query.end_year) {
            query.year = {}; 
            
            if (req.query.start_year) {
                query.year.$gte = parseInt(req.query.start_year); // $gte = Mayor o igual que
                delete req.query.start_year; // Borramos para que no interfiera abajo
            }
            
            if (req.query.end_year) {
                query.year.$lte = parseInt(req.query.end_year);   // $lte = Menor o igual que
                delete req.query.end_year; // Borramos para que no interfiera abajo
            }
        }
        // -----------------------------------------------

        const operatorMap = { ">": "$gt", "<": "$lt", ">=": "$gte", "<=": "$lte" };
        const operators = [">=", "<=", ">", "<"];

        Object.keys(req.query).forEach(key => {
            const value = req.query[key];

            if (typeof value === "string" && value.includes("-")) {
                const [min, max] = value.split("-");
                query[key] = {};
                if (min !== "") query[key]["$gte"] = isNaN(min) ? min : Number(min);
                if (max !== "") query[key]["$lte"] = isNaN(max) ? max : Number(max);
                return;
            }

            for (const op of operators) {
                if (typeof value === "string" && value.startsWith(op)) {
                    const valStr = value.slice(op.length);
                    const valParsed = isNaN(valStr) ? valStr : Number(valStr);
                    if (!query[key]) query[key] = {};
                    query[key][operatorMap[op]] = valParsed;
                    return;
                }
            }

            query[key] = isNaN(value) ? value : Number(value);
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
    // El ID compuesto es: país, año y sexo
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

        // Validación estricta JSON (Error 400) - 10 campos
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

        // Validación estricta JSON (Error 400) - 10 campos
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
    // 10. REDIRECCIÓN A DOCS (Postman)
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages/docs", (req, res) => {
        res.redirect(DOCS_URL);
    });
}