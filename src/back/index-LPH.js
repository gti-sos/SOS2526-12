import dataStore from 'nedb';

let BASE_URL_API = "/api/v2";
let db = new dataStore({ filename: 'birth-death-growth-rates.db', autoload: true });
let DOCS_URL_V1 = "https://documenter.getpostman.com/view/52398391/2sBXigLYdf";
let DOCS_URL_V2 = "https://documenter.getpostman.com/view/52398391/2sBXijJBsJ";

function isValidRecord(record) {
    if (!record.country_code || record.country_code === "") return false;
    if (!record.country_name || record.country_name === "") return false;
    if (record.year === undefined || record.year === null || record.year === "" || isNaN(record.year)) return false;
    return true;
}

const initialRecords = [
    { country_code: "SI", country_name: "Slovenia",         year: 2022, crude_birth_rate: 7.52,  crude_death_rate: 12.28, net_migration: 0.32,  rate_natural_increase: -0.476, growth_rate: -0.444 },
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
    { country_code: "ET", country_name: "Ethiopia",         year: 2021, crude_birth_rate: 35.10, crude_death_rate: 7.20,  net_migration: -0.20, rate_natural_increase: 2.790,  growth_rate: 2.710  },
];

export function loadBackend(app) {

    app.get("/api/v1/birth-death-growth-rates/docs", (req, res) => {
        res.redirect(DOCS_URL_V1);
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates/docs", (req, res) => {
        res.redirect(DOCS_URL_V2);
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates/loadInitialData", (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            db.insert(initialRecords, (err, inserted) => {
                if (err) return res.status(500).json({ message: "Database error" });
                const clean = inserted.map(({ _id, ...rest }) => rest);
                res.status(200).json(clean);
            });
        });
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        const filters = req.query;
        const query = {};
        const operatorMap = { ">": "$gt", "<": "$lt", ">=": "$gte", "<=": "$lte" };
        const operators = [">=", "<=", ">", "<"];

        Object.keys(filters).forEach(key => {
            const value = filters[key];
            if (typeof value === "string" && /^\d+-\d+$/.test(value)) {
                const [min, max] = value.split("-");
                query[key] = { "$gte": Number(min), "$lte": Number(max) };
                return;
            }
            for (const op of operators) {
                if (value.startsWith(op)) {
                    const num = Number(value.slice(op.length));
                    if (!query[key]) query[key] = {};
                    query[key][operatorMap[op]] = num;
                    return;
                }
            }
            query[key] = isNaN(value) ? value : Number(value);
        });

        db.find(query, (err, records) => {
            const clean = records.map(({ _id, ...rest }) => rest);
            res.status(200).json(clean);
        });
    });

    app.get(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        const country_code = req.params.country_code;
        const year = parseInt(req.params.year);

        db.find({ country_code, year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }
            const { _id, ...clean } = records[0];
            res.status(200).json(clean);
        });
    });

    app.post(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        const newRecord = req.body;

        if (!isValidRecord(newRecord)) {
            return res.status(400).json({ message: "Missing required fields: country_code, country_name, year" });
        }

        db.find({ country_code: newRecord.country_code, year: newRecord.year }, (err, records) => {
            if (records.length > 0) {
                return res.status(409).json({ message: "Record already exists" });
            }
            db.insert(newRecord, (err, inserted) => {
                if (err) return res.status(500).json({ message: "Database error" });
                const { _id, ...clean } = inserted;
                res.status(201).json(clean);
            });
        });
    });

    app.post(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    app.put(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        const country_code = req.params.country_code;
        const year = Number(req.params.year);
        const updatedRecord = req.body;

        if (!isValidRecord(updatedRecord)) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (updatedRecord.country_code !== country_code || Number(updatedRecord.year) !== year) {
            return res.status(400).json({ message: "country_code and year in body must match the URL" });
        }

        db.find({ country_code, year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }
            const { _id } = records[0];
            db.update({ _id }, { $set: updatedRecord }, {}, (err) => {
                if (err) return res.status(500).json({ message: "Database error" });
                res.status(200).json(updatedRecord);
            });
        });
    });

    app.put(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed" });
    });

    app.delete(BASE_URL_API + "/birth-death-growth-rates", (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res.status(200).json({ message: "All records deleted successfully" });
        });
    });

    app.delete(BASE_URL_API + "/birth-death-growth-rates/:country_code/:year", (req, res) => {
        const country_code = req.params.country_code;
        const year = Number(req.params.year);

        db.find({ country_code, year }, (err, records) => {
            if (records.length === 0) {
                return res.status(404).json({ message: "Record not found" });
            }
            db.remove({ country_code, year }, {}, (err) => {
                if (err) return res.status(500).json({ message: "Database error" });
                res.status(200).json({ message: "Record deleted successfully" });
            });
        });
    });
}
