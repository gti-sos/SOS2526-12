import dataStore from 'nedb';

let BASE_URL_API = "/api/v1/";
//create database:
let db = new dataStore();


export function loadBackend(app) {

    let data = [
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

    db.insert(contacts);

    app.get(BASE_URL_API + "/contacts", (req, res) => {

        db.find({}, (err, data) => { //{}devuelve todo

            let jsonData = JSON.stringify(contacts.map((c) => {
                delete c._id; return c;
            }), null, 2);
            console.log(`JSON Data to be sent: ${jsonData}`);
            res.send(jsonData);

        })

    });
    app.post(BASE_URL_API + "/contacts", (req, res) => {
        let newContact = req.body;

        db.find({ name: newContact.name }, (err, datos) => {
            if (datos.length > 0){
                res.sendStatus(409, "CONFLICT");
            } else {

            }
        });
        console.log(`New contact received: ${JSON.stringify(newContact, null, 2)}`);
        db.insert(newContact);
        res.sendStatus(201, "CREATED");
    });

}