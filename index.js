let cool = require("cool-ascii-faces");
let express = require("express");
let PORT = process.env.PORT || 3000;

const app = express();
app.use("/", express.static("./static", {extensions: ["html"]}));
app.use(express.json());

let birthDeathData = [];

app.get("/api/v1/birth-death-growth-rates/loadInitialData", (req, res) => {
    if (birthDeathData.length === 0) {
        birthDeathData = [
            { country_code: "SI", country_name: "Slovenia",         year: 2022, crude_birth_rate: 7.52,  crude_death_rate: 12.28, net_migration: 0.32,  rate_natural_increase: -0.476, growth_rate: -0.444 },
            { country_code: "SI", country_name: "Slovenia",         year: 2026, crude_birth_rate: 7.26,  crude_death_rate: 12.84, net_migration: 0.30,  rate_natural_increase: -0.558, growth_rate: -0.529 },
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
        ];
        res.status(200).json({ message: "Initial data loaded successfully", count: birthDeathData.length });
    } else {
        res.status(200).json({ message: "Data already loaded", count: birthDeathData.length });
    }
});

app.get("/api/v1/birth-death-growth-rates", (req, res) => {
    let result = birthDeathData;
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

app.get("/api/v1/birth-death-growth-rates/:country_code/:year", (req, res) => {
    const { country_code, year } = req.params;
    const record = birthDeathData.find(d => d.country_code === country_code && d.year === parseInt(year));

    if (record) {
        res.status(200).json(record);
    } else {
        res.status(404).json({ message: "Record not found" });
    }
});

app.post("/api/v1/birth-death-growth-rates", (req, res) => {
    const newRecord = req.body;

    if (!newRecord.country_code || !newRecord.country_name || !newRecord.year) {
        return res.status(400).json({ message: "Missing required fields: country_code, country_name, year" });
    }

    const exists = birthDeathData.find(d => d.country_code === newRecord.country_code && d.year === newRecord.year);
    if (exists) {
        return res.status(400).json({ message: "Record already exists" });
    }

    birthDeathData.push(newRecord);
    res.status(201).json(newRecord);
});

app.put("/api/v1/birth-death-growth-rates/:country_code/:year", (req, res) => {
    const { country_code, year } = req.params;
    const index = birthDeathData.findIndex(d => d.country_code === country_code && d.year === parseInt(year));

    if (index === -1) {
        return res.status(404).json({ message: "Record not found" });
    }

    birthDeathData[index] = { ...birthDeathData[index], ...req.body };
    res.status(200).json(birthDeathData[index]);
});

app.delete("/api/v1/birth-death-growth-rates/:country_code/:year", (req, res) => {
    const { country_code, year } = req.params;
    const index = birthDeathData.findIndex(d => d.country_code === country_code && d.year === parseInt(year));

    if (index === -1) {
        return res.status(404).json({ message: "Record not found" });
    }

    birthDeathData.splice(index, 1);
    res.status(200).json({ message: "Record deleted successfully" });
});

app.get("/", (req, res) => {
    res.send(`<html><body><h1>${cool()}<h1><body><html>`);
});

app.get("/samples/LPH", (req, res) => {
    const data = [
        { country_code: "SI", country_name: "Slovenia",         year: 2022, crude_birth_rate: 7.52,  crude_death_rate: 12.28 },
        { country_code: "SI", country_name: "Slovenia",         year: 2026, crude_birth_rate: 7.26,  crude_death_rate: 12.84 },
        { country_code: "SI", country_name: "Slovenia",         year: 2021, crude_birth_rate: 7.80,  crude_death_rate: 12.50 },
        { country_code: "LG", country_name: "Latvia",           year: 2022, crude_birth_rate: 8.7,   crude_death_rate: 14.73 },
        { country_code: "MG", country_name: "Mongolia",         year: 2022, crude_birth_rate: 15.6,  crude_death_rate: 6.36  },
        { country_code: "MR", country_name: "Mauritania",       year: 2022, crude_birth_rate: 28.11, crude_death_rate: 7.29  },
        { country_code: "LI", country_name: "Liberia",          year: 2022, crude_birth_rate: 30.92, crude_death_rate: 8.47  },
        { country_code: "TB", country_name: "Saint Barthelemy", year: 2022, crude_birth_rate: 9.31,  crude_death_rate: 9.45  },
        { country_code: "UP", country_name: "Ukraine",          year: 2022, crude_birth_rate: 9.16,  crude_death_rate: 13.82 },
        { country_code: "CY", country_name: "Cyprus",           year: 2022, crude_birth_rate: 10.58, crude_death_rate: 7.18  },
        { country_code: "VE", country_name: "Venezuela",        year: 2022, crude_birth_rate: 17.32, crude_death_rate: 5.47  },
        { country_code: "ET", country_name: "Ethiopia",         year: 2022, crude_birth_rate: 34.37, crude_death_rate: 6.95  },
        { country_code: "ZA", country_name: "Zambia",           year: 2022, crude_birth_rate: 39.74, crude_death_rate: 11.1  },
    ];
    const pais = "Slovenia";
    const paisData = data.filter(item => item.country_name === pais);

    if (paisData.length > 0) {
        const sum = paisData.map(item => item.crude_birth_rate).reduce((acc, current) => acc + current, 0);
        const media = sum / paisData.length;
        res.send(`<html><body><h2>Datos de ${pais}: </h2><p>Media de crude_birth_rate: ${media.toFixed(2)}</p></body></html>`);
    } else {
        res.send(`No hay datos para: ${pais}`);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
