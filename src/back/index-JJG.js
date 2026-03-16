import dataStore from 'nedb';

let BASE_URL_API = "/api/v1";
let db = new dataStore();
let DOCS_URL = "https://documenter.getpostman.com/view/52368982/2sBXigMtBS"; 

export function loadBackend(app) {

    // Datos iniciales de tu ficha de trabajo
    let initialRecords = [
        { country_name: "Afghanistan", year: 1979, sex: "Male", population_age_100: 2 },
        { country_name: "Azerbaijan", year: 1992, sex: "Female", population_age_100: 3 },
        { country_name: "Azerbaijan", year: 1990, sex: "Female", population_age_100: 8 },
        { country_name: "Armenia", year: 1991, sex: "Female", population_age_100: 37 },
        { country_name: "Andorra", year: 1991, sex: "Female", population_age_100: 37 },
        { country_name: "Australia", year: 1986, sex: "Male", population_age_100: 163 },
        { country_name: "Bahrain", year: 1982, sex: "Male", population_age_100: 0 },
        { country_name: "Botswana", year: 1983, sex: "Male", population_age_100: 3 },
        { country_name: "Bermuda", year: 1992, sex: "Male", population_age_100: 0 },
        { country_name: "Bahamas The", year: 1980, sex: "Male", population_age_100: 0 }
    ];
    db.insert(records);
    // ==========================================
    // 1. CARGA DE DATOS INICIALES
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages/loadInitialData", (req, res) => {
        db.find({}, (err, records) => {
            if (err) return res.status(500).json({ message: "Error interno de la base de datos" });
            
            if (records.length === 0) {
                // Ahora sí, initialRecords existe
                db.insert(initialRecords, (err, newDocs) => {
                    if (err) {
                        console.error(" Error de NeDB al insertar:", err);
                        return res.status(500).json({ message: "Error al insertar datos" });
                    }
                    console.log(`Cargados ${newDocs.length} registros iniciales.`);
                    res.status(201).json(newDocs.map(({ _id, ...rest }) => rest)); 
                });
            } else {
                // Es buena práctica avisar si los datos ya estaban cargados
                res.status(200).json({ message: "Los datos ya estaban cargados previamente" });
            }
        });
    });

    // ==========================================
    // 2. GET A LA COLECCIÓN (Búsqueda y Paginación)
    // ==========================================
    app.get(BASE_URL_API + "/mid-population-ages", (req, res) => {
        const query = {};
        
        // Variables de paginación
        let offset = 0;
        let limit = Number.MAX_SAFE_INTEGER;

        if (req.query.offset) {
            offset = parseInt(req.query.offset);
            delete req.query.offset; // Lo quitamos para que no afecte a la búsqueda por campos
        }
        if (req.query.limit) {
            limit = parseInt(req.query.limit);
            delete req.query.limit;
        }

        // Configuración de operadores para búsquedas avanzadas
        const operatorMap = { ">": "$gt", "<": "$lt", ">=": "$gte", "<=": "$lte" };
        const operators = [">=", "<=", ">", "<"];

        Object.keys(req.query).forEach(key => {
            const value = req.query[key];

            // Rango con guion (ej. ?year=1980-1990)
            if (typeof value === "string" && value.includes("-")) {
                const [min, max] = value.split("-");
                query[key] = {};
                if (min !== "") query[key]["$gte"] = isNaN(min) ? min : Number(min);
                if (max !== "") query[key]["$lte"] = isNaN(max) ? max : Number(max);
                return;
            }

            // Operadores mayor/menor (ej. ?population_age_100=>=10)
            for (const op of operators) {
                if (typeof value === "string" && value.startsWith(op)) {
                    const valStr = value.slice(op.length);
                    const valParsed = isNaN(valStr) ? valStr : Number(valStr);
                    if (!query[key]) query[key] = {};
                    query[key][operatorMap[op]] = valParsed;
                    return;
                }
            }

            // Búsqueda exacta normal (ej. ?country_name=Andorra)
            query[key] = isNaN(value) ? value : Number(value);
        });

        db.find(query).skip(offset).limit(limit).exec((err, records) => {
            if (err) return res.status(500).json({ message: "Error en la base de datos" });
            
            // Requisito: Siempre devolver un Array en GET a colección
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
            
            // Requisito: Siempre devolver un Objeto en GET a recurso
            const { _id, ...cleanRecord } = records[0];
            res.status(200).json(cleanRecord);
        });
    });

    // ==========================================
    // 4. POST A LA COLECCIÓN
    // ==========================================
    app.post(BASE_URL_API + "/mid-population-ages", (req, res) => {
        const newRecord = req.body;
        
        // Requisito: Si el cliente envía un _id, lo borramos
        if (newRecord._id) delete newRecord._id;

        // Requisito: Validación estricta JSON (Error 400)
        const expectedFields = ["country_name", "year", "sex", "population_age_100"];
        const receivedFields = Object.keys(newRecord);
        
        const hasAllFields = expectedFields.every(field => receivedFields.includes(field));
        const hasExtraFields = receivedFields.length > expectedFields.length;

        if (!hasAllFields || hasExtraFields) {
            return res.status(400).json({ message: "Bad request. La estructura JSON debe tener exactamente los 4 campos esperados." });
        }

        // Comprobamos si ya existe para devolver 409
        db.find({ country_name: newRecord.country_name, year: newRecord.year, sex: newRecord.sex }, (err, records) => {
            if (err) return res.status(500).json({ message: "Error interno" });
            if (records.length > 0) return res.status(409).json({ message: "Conflicto: El recurso ya existe" });
            
            db.insert(newRecord, (err, insertedDoc) => {
                if (err) {
                    console.error(" Error de NeDB en el POST:", err); // <-- Añadimos esto
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

        // Validación estricta JSON (Error 400)
        const expectedFields = ["country_name", "year", "sex", "population_age_100"];
        const receivedFields = Object.keys(updatedRecord);
        
        const hasAllFields = expectedFields.every(field => receivedFields.includes(field));
        const hasExtraFields = receivedFields.length > expectedFields.length;

        if (!hasAllFields || hasExtraFields) {
            return res.status(400).json({ message: "Bad request. La estructura JSON debe tener exactamente los 4 campos esperados." });
        }

        // Requisito: Validar que los datos del body coinciden con la URL
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