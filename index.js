let cool = require("cool-ascii-faces");
let express = require("express");
let PORT = process.env.PORT || 3000;

const app = express();
app.use("/", express.static("./static", {extensions: ["html"]}));
app.use(express.json());

//API LPH
const birthDeathRouter = require("./routes/birth-death-growth-rates");
app.use("/api/v1", birthDeathRouter);

const populationRouter = require("./routes/mid-population-ages");
app.use("/api/v1", populationRouter);

// Página principal
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

app.get("/samples/JJG", (req, res) => {
    
    const data = [
        { country_name: "Afghanistan", year: 1979, sex: "Male", population_age_100: 2 },
        { country_name: "Azerbaijan", year: 1992, sex: "Female", population_age_100: 3 },
        { country_name: "Azerbaijan", year: 1990, sex: "Female", population_age_100: 8 },
        { country_name: "Armenia", year: 1991, sex: "Female", population_age_100: 37 },
        { country_name: "Andorra", year: 1991, sex: "Female", population_age_100: 37 },
        { country_name: "Australia", year: 1986, sex: "Male", population_age_100: 163 },
        { country_name: "Barhain", year: 1982, sex: "Male", population_age_100: 0 },
        { country_name: "Bostwana", year: 1983, sex: "Male", population_age_100: 3 },
        { country_name: "Bermuda", year: 1992, sex: "Male", population_age_100: 0 },
        { country_name: "Bahamas The", year: 1980, sex: "Male", population_age_100: 0 }
    ];


    const geoFilter = "Azerbaijan";
    const filteredRows = data.filter(row => row.country_name === geoFilter);
    const total = filteredRows.map(row => row.population_age_100).reduce((acc, current) => acc + current, 0);
    const average = filteredRows.length > 0 ? total / filteredRows.length : 0;


    app.get("/samples/FMG", (req, res) => {
    const data = [
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

    const countryToAnalyze = "Slovenia";
    const countryData = data.filter(item => item.country_name === countryToAnalyze);

    if (countryData.length > 0) {
        const sum = countryData
            .map(item => item.fert_15_19)
            .reduce((acc, current) => acc + current, 0);

        const average = sum / countryData.length;
    } else {
        res.status(404).send(`No se encontraron datos para ${countryToAnalyze}`);
    }
});



    res.send(`
        <html>
            <head>
                <title>Sample JJG</title>
            </head>
            <body>
                <h1>Algoritmo de JJG (Javier Jimenez Garcia)</h1>
                <p><strong>Filtro geográfico:</strong> ${geoFilter}</p>
                <p><strong>Cálculo:</strong> Media de population_age_100</p>
                <hr>
                <h2>Resultado: ${average.toFixed(2)}</h2>
                <br>
                <a href="/">Volver al inicio</a>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
