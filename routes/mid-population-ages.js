const express = require("express");
const router = express.Router();


let populationData = [];

router.get("/population-stats/loadInitialData", (req, res) => {
    if (populationData.length === 0) {
        populationData = [
            { country_name: "afghanistan", year: 1979, sex: "male", population_age_100: 2 },
            { country_name: "azerbaijan", year: 1992, sex: "female", population_age_100: 3 },
            { country_name: "azerbaijan", year: 1990, sex: "female", population_age_100: 8 },
            { country_name: "armenia", year: 1991, sex: "female", population_age_100: 37 },
            { country_name: "andorra", year: 1991, sex: "female", population_age_100: 37 },
            { country_name: "australia", year: 1986, sex: "male", population_age_100: 163 },
            { country_name: "barhain", year: 1982, sex: "male", population_age_100: 0 },
            { country_name: "bostwana", year: 1983, sex: "male", population_age_100: 3 },
            { country_name: "bermuda", year: 1992, sex: "male", population_age_100: 0 },
            { country_name: "bahamas-the", year: 1980, sex: "male", population_age_100: 0 },
            { country_name: "spain", year: 2021, sex: "female", population_age_100: 450 } // Dato extra para llegar a 11
        ];
        res.status(201).json({ message: "Initial data loaded", count: populationData.length });
    } else {
        res.status(400).json({ message: "Data already initialized" });
    }
});


router.get("/population-stats", (req, res) => {
    res.status(200).json(populationData);
});


router.post("/population-stats", (req, res) => {
    const newData = req.body;

    
    if (!newData.country_name || !newData.year || !newData.sex || newData.population_age_100 === undefined) {
        return res.status(400).json({ message: "Missing fields" });
    }

    
    const exists = populationData.find(d => d.country_name === newData.country_name && d.year === parseInt(newData.year));
    if (exists) {
        return res.status(409).json({ message: "Resource already exists" });
    }

    populationData.push(newData);
    res.status(201).json(newData);
});

router.get("/population-stats/:country_name/:year", (req, res) => {
    const { country_name, year } = req.params;
    const resource = populationData.find(d => d.country_name === country_name && d.year === parseInt(year));

    if (resource) {
        res.status(200).json(resource);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

router.put("/population-stats/:country_name/:year", (req, res) => {
    const { country_name, year } = req.params;
    const index = populationData.findIndex(d => d.country_name === country_name && d.year === parseInt(year));

    if (index === -1) {
        return res.status(404).json({ message: "Resource not found" });
    }

    
    if (req.body.country_name !== country_name || parseInt(req.body.year) !== parseInt(year)) {
        return res.status(400).json({ message: "URL ID and Body ID do not match" });
    }

    populationData[index] = { ...populationData[index], ...req.body };
    res.status(200).json(populationData[index]);
});


router.delete("/population-stats/:country_name/:year", (req, res) => {
    const { country_name, year } = req.params;
    const initialLength = populationData.length;
    populationData = populationData.filter(d => !(d.country_name === country_name && d.year === parseInt(year)));

    if (populationData.length < initialLength) {
        res.status(200).json({ message: "Resource deleted" });
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});


router.delete("/population-stats", (req, res) => {
    populationData = [];
    res.status(200).json({ message: "All resources deleted" });
});


router.post("/population-stats/:country_name/:year", (req, res) => {
    res.status(405).json({ message: "Method not allowed on specific resource" });
});

router.put("/population-stats", (req, res) => {
    res.status(405).json({ message: "Method not allowed on base collection" });
});

module.exports = router;