import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';

import { loadBackend as loadLHP } from "./src/back/index-LPH.js";
//import { loadBackend as loadJJF } from "./src/back/index-JJG.js";
import { loadBackend as loadFMG } from "./src/back/index-FMG.js";


let PORT = process.env.PORT || 3000;
const app = express();

app.use("/", express.static("./static"));
app.use(bodyParser.json());



export function loadBackend(app) {
    loadLHP(app);
    //loadJJF(app);
    loadFMG(app);
}

loadBackend(app);

// --- Iniciar Servidor ---
app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});

app.get('/about', (req, res) => {
    res.sendFile(path.resolve('./static/about.html'));
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

