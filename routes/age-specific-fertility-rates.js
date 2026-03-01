const express = require("express");
const router = express.Router();

// Array en memoria para almacenar tus datos
let fertilityData = [];

// 1. Carga de datos iniciales (loadInitialData)
router.get("/age-specific-fertility-rates/loadInitialData", (req, res) => {
    if (fertilityData.length === 0) {
        fertilityData = [
            { country_code: "SI", country_name: "Slovenia", year: 2022, fertility_rate_15_19: 7.5, fertility_rate_20_24: 56.4, fertility_rate_25_29: 106.1 },
            { country_code: "LG", country_name: "Latvia", year: 2022, fertility_rate_14: 14, fertility_rate_20_24: 54, fertility_rate_25_29: 95 },
            { country_code: "MG", country_name: "Mongolia", year: 2022, fertility_rate_15_19: 14.7, fertility_rate_20_24: 101, fertility_rate_25_29: 115.9 },
            { country_code: "MR", country_name: "Mauritania", year: 2022, fertility_rate_15_19: 57.4, fertility_rate_20_24: 129.7, fertility_rate_25_29: 168.2 },
            { country_code: "LI", country_name: "Liberia", year: 2022, fertility_rate_15_19: 85.5, fertility_rate_20_24: 167.9, fertility_rate_25_29: 186.9 },
            { country_code: "TB", country_name: "Saint Barthelemy", year: 2022, fertility_rate_15_19: 14.3, fertility_rate_20_24: 67, fertility_rate_25_29: 110.6 },
            { country_code: "UP", country_name: "Ukraine", year: 2022, fertility_rate_15_19: 25.9, fertility_rate_20_24: 89.1, fertility_rate_25_29: 120.5 },
            { country_code: "CD", country_name: "Chad", year: 2022, fertility_rate_15_19: 153.8, fertility_rate_20_24: 247.6, fertility_rate_25_29: 230.1 },
            { country_code: "ES", country_name: "Spain", year: 2022, fertility_rate_15_19: 7.0, fertility_rate_20_24: 24.5, fertility_rate_25_29: 50.2 },
            { country_code: "IT", country_name: "Italy", year: 2022, fertility_rate_15_19: 6.1, fertility_rate_20_24: 22.4, fertility_rate_25_29: 48.9 }
        ];
        res.status(200).json({ message: "Fertility data loaded successfully", count: fertilityData.length });
    } else {
        res.status(200).json({ message: "Data already loaded", count: fertilityData.length });
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