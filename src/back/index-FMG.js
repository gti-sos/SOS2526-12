import dataStore from 'nedb';

let BASE_URL_API = "/api/v2";
let db = new dataStore();
let DOC_URL= "https://documenter.getpostman.com/view/52304863/2sBXijHX4D";

function loadBackend(app) {
    let initialData = [
        { country_code: "SI", country_name: "Slovenia", year: 2022, fert_15_19: 7.5, fert_20_24: 56.4 },
        { country_code: "SI", country_name: "Slovenia", year: 2021, fert_15_19: 8.1, fert_20_24: 55.2 },
        { country_code: "SI", country_name: "Slovenia", year: 2020, fert_15_19: 7.8, fert_20_24: 54.9 },
        { country_code: "LG", country_name: "Latvia", year: 2022, fert_15_19: 14, fert_20_24: 54 },
        { country_code: "MG", country_name: "Mongolia", year: 2022, fert_15_19: 14.7, fert_20_24: 101 },
        { country_code: "MR", country_name: "Mauritania", year: 2022, fert_15_19: 57.4, fert_20_24: 129.7 },
        { country_code: "LI", country_name: "Liberia", year: 2022, fert_15_19: 85.5, fert_20_24: 167.9 },
        { country_code: "TB", country_name: "Saint Barthelemy", year: 2022, fert_15_19: 14.3, fert_20_24: 67 },
        { country_code: "UP", country_name: "Ukraine", year: 2022, fert_15_19: 25.9, fert_20_24: 89.1 },
        { country_code: "CD", country_name: "Chad", year: 2022, fert_15_19: 153.8, fert_20_24: 247.6 },
        { country_code: "SP", country_name: "Spain", year: 2022, fert_15_19: 100.8, fert_20_24: 199.6 },
        { country_code: "IT", country_name: "Italy", year: 2022, fert_15_19: 123.8, fert_20_24: 207.6 }
    ];

    // Cargar datos iniciales (Ruta para POSTMAN y test)
    app.get(BASE_URL_API + "/age-specific-fertility-rates/loadInitialData", (req, res) => {
        db.remove({}, { multi: true }, function (err, numRemoved) {
            db.insert(initialData);
            res.status(200).json({ message: "Initial data loaded", count: initialData.length });
        });
    });

    // GET: Obtener todos los recursos (CON BÚSQUEDA Y PAGINACIÓN) - Devuelve ARRAY
    app.get(BASE_URL_API + "/age-specific-fertility-rates", (req, res) => {
        let searchQuery = {};

        // Filtros de búsqueda
        if (req.query.country_code) searchQuery.country_code = req.query.country_code;
        if (req.query.country_name) searchQuery.country_name = req.query.country_name;
        if (req.query.year) searchQuery.year = parseInt(req.query.year);
        if (req.query.fert_15_19) searchQuery.fert_15_19 = parseFloat(req.query.fert_15_19);
        if (req.query.fert_20_24) searchQuery.fert_20_24 = parseFloat(req.query.fert_20_24);

        let dbQuery = db.find(searchQuery);

        // Paginación
        if (req.query.limit) dbQuery = dbQuery.limit(parseInt(req.query.limit));
        if (req.query.offset) dbQuery = dbQuery.skip(parseInt(req.query.offset));

        dbQuery.exec((err, records) => {
            if (err) return res.status(500).json({ message: "Internal server error" });
            
            // Limpiamos el _id de NeDB
            const clean = records.map(r => { const { _id, ...rest } = r; return rest; });
            res.status(200).json(clean);
        });
    });

    // GET: Obtener recurso por país y año - Devuelve OBJETO
    app.get(BASE_URL_API + "/age-specific-fertility-rates/:country_code/:year", (req, res) => {
        let country_code = req.params.country_code;
        let year = parseInt(req.params.year);

        db.find({ country_code: country_code, year: year }, (err, records) => {
            if (err) return res.status(500).json({ message: "Internal server error" });
            if (records.length === 0) return res.status(404).json({ message: "Record not found" });
            
            const clean = records.map(r => { const { _id, ...rest } = r; return rest; });
            res.status(200).json(clean[0]); // El [0] asegura que devolvemos un Objeto
        });
    });

    // POST: Añadir nuevo recurso (Con validación estricta 400 y Conflicto 409)
    app.post(BASE_URL_API + "/age-specific-fertility-rates", (req, res) => {
        let newRecord = req.body;
        
        // Validación estricta de campos (Exactamente estos 5)
        const expectedKeys = ["country_code", "country_name", "year", "fert_15_19", "fert_20_24"];
        const recordKeys = Object.keys(newRecord);
        let hasAllKeys = expectedKeys.every(key => recordKeys.includes(key));
        let hasExactLength = recordKeys.length === expectedKeys.length;

        if (!hasAllKeys || !hasExactLength) {
            return res.status(400).json({ message: "Bad Request: Incorrect field structure" });
        }

        // Comprobación de conflicto
        db.find({ country_code: newRecord.country_code, year: newRecord.year }, (err, records) => {
            if (records.length > 0) return res.status(409).json({ message: "Record already exists" });
            
            db.insert(newRecord);
            res.status(201).json({ message: "Created" });
        });
    });

    // POST sobre un recurso concreto (No permitido)
    app.post(BASE_URL_API + "/age-specific-fertility-rates/:country_code/:year", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    // PUT: Actualizar recurso (Con validación estricta 400 y comprobación de URL)
    app.put(BASE_URL_API + "/age-specific-fertility-rates/:country_code/:year", (req, res) => {
        let country_code = req.params.country_code;
        let year = parseInt(req.params.year);
        let updatedRecord = req.body;

        // Validación estricta de campos
        const expectedKeys = ["country_code", "country_name", "year", "fert_15_19", "fert_20_24"];
        const recordKeys = Object.keys(updatedRecord);
        let hasAllKeys = expectedKeys.every(key => recordKeys.includes(key));
        let hasExactLength = recordKeys.length === expectedKeys.length;

        if (!hasAllKeys || !hasExactLength) {
            return res.status(400).json({ message: "Bad Request: Incorrect field structure" });
        }

        // Comprobar que URL y Body coinciden
        if (updatedRecord.country_code !== country_code || updatedRecord.year !== year) {
            return res.status(400).json({ message: "Bad Request: Data mismatch" });
        }

        // --- SOLUCIÓN: Usamos $set para evitar machacar el _id interno de NeDB ---
        db.update({ country_code: country_code, year: year }, { $set: updatedRecord }, {}, (err, numReplaced) => {
            if (err) return res.status(500).json({ message: "Internal server error" });
            if (numReplaced === 0) return res.status(404).json({ message: "Record not found" });
            res.status(200).json({ message: "Updated successfully" });
        });
    });

    // PUT sobre la colección entera (No permitido)
    app.put(BASE_URL_API + "/age-specific-fertility-rates", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    // DELETE: Borrar todos
    app.delete(BASE_URL_API + "/age-specific-fertility-rates", (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            res.status(200).json({ message: "All records deleted successfully" });
        });
    });

    // DELETE: Borrar recurso concreto
    app.delete(BASE_URL_API + "/age-specific-fertility-rates/:country_code/:year", (req, res) => {
        let country_code = req.params.country_code;
        let year = parseInt(req.params.year);

        db.remove({ country_code: country_code, year: year }, {}, (err, numRemoved) => {
            if (numRemoved === 0) return res.status(404).json({ message: "Record not found" });
            res.status(200).json({ message: "Record deleted successfully" });
        });
    });

    // DOCS: Redirección a Postman
    app.get(BASE_URL_API + "/age-specific-fertility-rates/docs", (req, res) => {
        res.redirect(DOC_URL);    
    });
}

export { loadBackend };