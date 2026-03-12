import dataStore from 'neapp';

let BASE_URL_API = "/api/v1/";
//create database:
let db = new dataStore();


export function loadBackend(appLPH) {

    let records = [
        { country_code: "SI", country_name: "Slovenia", year: 2022, crude_birth_rate: 7.52, crude_death_rate: 12.28, net_migration: 0.32, rate_natural_increase: -0.476, growth_rate: -0.444 },
        { country_code: "SI", country_name: "Slovenia", year: 2026, crude_birth_rate: 7.26, crude_death_rate: 12.84, net_migration: 0.30, rate_natural_increase: -0.558, growth_rate: -0.529 },
        { country_code: "LG", country_name: "Latvia", year: 2022, crude_birth_rate: 8.70, crude_death_rate: 14.73, net_migration: -5.71, rate_natural_increase: -0.603, growth_rate: -1.174 },
        { country_code: "MG", country_name: "Mongolia", year: 2022, crude_birth_rate: 15.60, crude_death_rate: 6.36, net_migration: -0.78, rate_natural_increase: 0.924, growth_rate: 0.847 },
        { country_code: "MR", country_name: "Mauritania", year: 2022, crude_birth_rate: 28.11, crude_death_rate: 7.29, net_migration: -0.72, rate_natural_increase: 2.082, growth_rate: 2.01 },
        { country_code: "LI", country_name: "Liberia", year: 2022, crude_birth_rate: 30.92, crude_death_rate: 8.47, net_migration: 0, rate_natural_increase: 2.245, growth_rate: 2.246 },
        { country_code: "TB", country_name: "Saint Barthelemy", year: 2022, crude_birth_rate: 9.31, crude_death_rate: 9.45, net_migration: -1.83, rate_natural_increase: -0.014, growth_rate: -0.197 },
        { country_code: "UP", country_name: "Ukraine", year: 2022, crude_birth_rate: 9.16, crude_death_rate: 13.82, net_migration: -0.26, rate_natural_increase: -0.466, growth_rate: -0.493 },
        { country_code: "CY", country_name: "Cyprus", year: 2022, crude_birth_rate: 10.58, crude_death_rate: 7.18, net_migration: 6.97, rate_natural_increase: 0.34, growth_rate: 1.037 },
        { country_code: "VE", country_name: "Venezuela", year: 2022, crude_birth_rate: 17.32, crude_death_rate: 5.47, net_migration: -1.1, rate_natural_increase: 1.185, growth_rate: 1.074 },
        { country_code: "ET", country_name: "Ethiopia", year: 2022, crude_birth_rate: 34.37, crude_death_rate: 6.95, net_migration: -0.18, rate_natural_increase: 2.742, growth_rate: 2.724 },
        { country_code: "ZA", country_name: "Zambia", year: 2022, crude_birth_rate: 39.74, crude_death_rate: 11.10, net_migration: 0, rate_natural_increase: 2.864, growth_rate: 2.864 },
    ];

    db.insert(records);

    app.get(BASE_URL_API + "/birth-death-growth-rates/loadInitialData", (req, res) => {

        db.find({}, (err, records) => {
            let jsonData = JSON.stringify(records.map((c) => {
                delete c._id; return c;
            }), null, 2);
            console.log(`JSON Data to be sent: ${jsonData}`);
            res.send(jsonData);
        });

    });

    appLPH.get(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        let { ...filters } = req.query;
        let query = {};
        Object.keys(filters).forEach(key => {
            query[key] = filters[key];
        });

        db.find({}, (err, records) => {
            if (records.length === 0) {
                res.status(404).json({ message: "Record not found" });
            } else {
                delete records[0]._id;
                res.status(200).json(records[0]);
            }
        });
    });

    appLPH.get(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        let country_code = req.params.country_code;
        let year = parseInt(req.params.year);

        db.find({ country_code: country_code, year: year }, (err, records) => {
            if (records.length === 0) {
                res.status(404).json({ message: "Record not found" });
            } else {
                delete records[0]._id;
                res.status(200).json(records[0]);
            }
        });
    });

    appLPH.post(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        let newRecord = req.body;

        if (!newRecord.country_code || !newRecord.country_name || !newRecord.year) {
            return res.status(400).json({ message: "Missing required fields: country_code, country_name, year" });
        }

        db.find({ country_code: newRecord.country_code, year: newRecord.year }, (err, records) => {
            if (records.length > 0) {
                return res.status(409).json({ message: "Record already exists" });
            }
            db.insert(newRecord);
            res.status(201).json(newRecord);
        });
    });

    appLPH.post(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    appLPH.put(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        let country_code = req.params.country_code;
        let year = parseInt(req.params.year);
        let updatedRecord = req.body;

        if (!updatedRecord.country_code || !updatedRecord.country_name || !updatedRecord.year) {
            return res.status(400).json({ message: "Missing required fields: country_code, country_name, year" });
        }

        if (updatedRecord.country_code !== country_code || updatedRecord.year !== year) {
            return res.status(400).json({ message: "country_code and year in body must match the URL" });
        }

        db.find({ country_code: country_code, year: year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }

            db.update({ country_code: country_code, year: year }, updatedRecord, {}, (err) => {
                if (err) {
                    res.status(500).json({ message: "Database error" });
                } else {
                    res.status(200).json(updatedRecord);
                }
            });
        });
    });

    appLPH.put(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    appLPH.delete(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) {
                res.status(500).json({ message: "Database error" });
            } else {
                res.status(200).json({ message: "All records deleted successfully" });
            }
        });
    });

    appLPH.delete(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        let country_code = req.params.country_code;
        let year = parseInt(req.params.year);

        db.find({ country_code: country_code, year: year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }

            db.remove({ country_code: country_code, year: year }, {}, (err) => {
                if (err) {
                    res.status(500).json({ message: "Database error" });
                } else {
                    res.status(200).json({ message: "Record deleted successfully" });
                }
            });
        });
    });

}
