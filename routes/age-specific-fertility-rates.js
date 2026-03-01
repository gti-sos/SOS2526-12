const express = require("express");
const router = express.Router();

// 1. Inicializamos el array vacío (así empieza al arrancar el servidor)
let fertilityData = [];

// 2. Ruta para cargar los datos iniciales
router.get("/age-specific-fertility-rates/loadInitialData", (req, res) => {
    
    // REQUISITO: Solo creamos los datos si el array está vacío
    if (fertilityData.length === 0) {
        fertilityData = [
            { country_code: "SI", country_name: "Slovenia", year: 2022, fert_15_19: 7.5, fert_20_24: 56.4 },
            { country_code: "SI", country_name: "Slovenia", year: 2021, fert_15_19: 8.1, fert_20_24: 55.2 },
            { country_code: "SI", country_name: "Slovenia", year: 2020, fert_15_19: 7.8, fert_20_24: 54.9 },
            { country_code: "LG", country_name: "Latvia", year: 2022, fert_15_19: 14, fert_20_24: 54 },
            { country_code: "MG", country_name: "Mongolia", year: 2022, fert_15_19: 14.7, fert_20_24: 101 },
            { country_code: "MR", country_name: "Mauritania", year: 2022, fert_15_19: 57.4, fert_20_24: 129.7 },
            { country_code: "LI", country_name: "Liberia", year: 2022, fert_15_19: 85.5, fert_20_24: 167.9 },
            { country_code: "TB", country_name: "Saint Barthelemy", year: 2022, fert_15_19: 14.3, fert_20_24: 67 },
            { country_code: "UP", country_name: "Ukraine", year: 2022, fert_15_19: 25.9, fert_20_24: 89.1 },
            { country_code: "CD", country_name: "Chad", year: 2022, fert_15_19: 153.8, fert_20_24: 247.6 }
        ];
        
        // Respuesta cuando se cargan por primera vez
        res.status(201).json({
            message: "Data initialized successfully",
            count: fertilityData.length
        });
    } else {
        // Respuesta si ya había datos (no hace nada)
        res.status(200).json({
            message: "Data already contains records",
            count: fertilityData.length
        });
    }
});

// 2. GET general con búsqueda/filtrado
router.get("/age-specific-fertility-rates", (req, res) => {
    let result = fertilityData;
    const { country_code, from, to } = req.query;

    if (country_code) {
        result = result.filter(d => d.country_code === country_code);
    }
    if (from) {
        result = result.filter(d => d.year >= parseInt(from));
    }
    if (to) {
        result = result.filter(d => d.year <= parseInt(to));
    }

    res.status(200).json(result);
});

// 3. GET a un recurso específico (país y año)
router.get("/age-specific-fertility-rates/:country_code/:year", (req, res) => {
    const { country_code, year } = req.params;
    const record = fertilityData.find(d => d.country_code === country_code && d.year === parseInt(year));

    if (record) {
        res.status(200).json(record);
    } else {
        res.status(404).json({ message: "Record not found" });
    }
});

// 4. POST para crear un recurso nuevo
router.post("/age-specific-fertility-rates", (req, res) => {
    const newRecord = req.body;

    if (!newRecord.country_code || !newRecord.country_name || !newRecord.year) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = fertilityData.find(d => d.country_code === newRecord.country_code && d.year === newRecord.year);
    if (exists) {
        return res.status(409).json({ message: "Record already exists" });
    }

    fertilityData.push(newRecord);
    res.status(201).json(newRecord);
});

// 5. PUT para actualizar un recurso existente
router.put("/age-specific-fertility-rates/:country_code/:year", (req, res) => {
    const { country_code, year } = req.params;
    const index = fertilityData.findIndex(d => d.country_code === country_code && d.year === parseInt(year));

    if (index === -1) {
        return res.status(404).json({ message: "Record not found" });
    }

    fertilityData[index] = { ...fertilityData[index], ...req.body };
    res.status(200).json(fertilityData[index]);
});

// 6. DELETE para borrar todo
router.delete("/age-specific-fertility-rates", (req, res) => {
    fertilityData = [];
    res.status(200).json({ message: "All records deleted successfully" });
});

// 7. DELETE para borrar un recurso específico
router.delete("/age-specific-fertility-rates/:country_code/:year", (req, res) => {
    const { country_code, year } = req.params;
    const index = fertilityData.findIndex(d => d.country_code === country_code && d.year === parseInt(year));

    if (index === -1) {
        return res.status(404).json({ message: "Record not found" });
    }

    fertilityData.splice(index, 1);
    res.status(200).json({ message: "Record deleted successfully" });
});

module.exports = router;