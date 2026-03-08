const cool = require("cool-ascii-faces");
const express = require("express");

const birthDeathRouter = require("./routes/birth-death-growth-rates.js");
const populationRouter = require("./routes/mid-population-ages.js");
const fertilityRouter = require("./routes/age-specific-fertility-rates.js");

const PORT = process.env.PORT || 3000;
const app = express();

// Configuración básica (El traductor de JSON va aquí)
app.use("/", express.static("./static", { extensions: ["html"] }));
app.use(express.json()); 

// --- APIs (Rutas externas) ---
app.use("/api/v1", birthDeathRouter);
app.use("/api/v1", populationRouter);
app.use("/api/v1", fertilityRouter);

// --- Página Principal / Cool ---
app.get("/cool", (req, res) => {
    res.send(`<html><body><h1>${cool()}</h1></body></html>`);
});

// --- SAMPLE LPH ---
app.get("/samples/LPH", (req, res) => {
    const data = [
        { country_code: "SI", country_name: "Slovenia", year: 2022, crude_birth_rate: 7.52, crude_death_rate: 12.28 },
        { country_code: "LG", country_name: "Latvia", year: 2022, crude_birth_rate: 8.7, crude_death_rate: 14.73 }
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

// --- SAMPLE JJG ---
app.get("/samples/JJG", (req, res) => {
    const data = [
        { country_name: "Afghanistan", year: 1979, sex: "Male", population_age_100: 2 },
        { country_name: "Azerbaijan", year: 1992, sex: "Female", population_age_100: 3 },
        { country_name: "Azerbaijan", year: 1990, sex: "Female", population_age_100: 8 }
    ];

    const geoFilter = "Azerbaijan";
    const filteredRows = data.filter(row => row.country_name === geoFilter);
    const total = filteredRows.map(row => row.population_age_100).reduce((acc, current) => acc + current, 0);
    const average = filteredRows.length > 0 ? total / filteredRows.length : 0;

    res.send(`
        <html>
            <head><title>Sample JJG</title></head>
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

// --- SAMPLE FMG ---
app.get("/samples/FMG", (req, res) => {
    const data = [
        { country_code: "SI", country_name: "Slovenia", year: 2022, fert_15_19: 7.5, fert_20_24: 56.4 },
        { country_code: "LG", country_name: "Latvia", year: 2022, fert_15_19: 14, fert_20_24: 54 }
    ];

    const countryToAnalyze = "Slovenia";
    const countryData = data.filter(item => item.country_name === countryToAnalyze);

    if (countryData.length > 0) {
        const sum = countryData.map(item => item.fert_15_19).reduce((acc, current) => acc + current, 0);
        const average = sum / countryData.length;
        res.send(`
            <html>
                <head><title>Sample FMG</title></head>
                <body>
                    <h1>Algoritmo de FMG (Francisco)</h1>
                    <p><strong>Filtro geográfico:</strong> ${countryToAnalyze}</p>
                    <p><strong>Campo analizado:</strong> fert_15_19</p>
                    <hr>
                    <h2>Media calculada: ${average.toFixed(2)}</h2>
                    <br>
                    <a href="/">Volver al inicio</a>
                </body>
            </html>
        `);
    } else {
        res.status(404).send(`No se encontraron datos para ${countryToAnalyze}`);
    }
});

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});