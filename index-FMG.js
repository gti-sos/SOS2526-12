/**
 * index-YYY.js (Sustituye YYY por tus siglas)
 * Algoritmo: Media de fertilidad (rango 15-19 años) para un país específico.
 * Fuente: Datos extraídos de SOS2526-12-Propuesta - Francisco.csv
 */

// 1. Inicialización del array con los datos de tu ficha de trabajo
// Requisito L02: Al menos 10 filas y un valor geográfico que se repita.
const data = [
    { country_code: "SI", country_name: "Slovenia", year: 2022, fert_15_19: 7.5, fert_20_24: 56.4 },
    { country_code: "SI", country_name: "Slovenia", year: 2021, fert_15_19: 8.1, fert_20_24: 55.2 }, // Extra para media
    { country_code: "SI", country_name: "Slovenia", year: 2020, fert_15_19: 7.8, fert_20_24: 54.9 }, // Extra para media
    { country_code: "LG", country_name: "Latvia", year: 2022, fert_15_19: 14, fert_20_24: 54 },
    { country_code: "MG", country_name: "Mongolia", year: 2022, fert_15_19: 14.7, fert_20_24: 101 },
    { country_code: "MR", country_name: "Mauritania", year: 2022, fert_15_19: 57.4, fert_20_24: 129.7 },
    { country_code: "LI", country_name: "Liberia", year: 2022, fert_15_19: 85.5, fert_20_24: 167.9 },
    { country_code: "TB", country_name: "Saint Barthelemy", year: 2022, fert_15_19: 14.3, fert_20_24: 67 },
    { country_code: "UP", country_name: "Ukraine", year: 2022, fert_15_19: 25.9, fert_20_24: 89.1 },
    { country_code: "CD", country_name: "Chad", year: 2022, fert_15_19: 153.8, fert_20_24: 247.6 }
];

// 2. Algoritmo usando iteradores
const countryToAnalyze = "Slovenia";

// Filtrar por el campo de información geográfica
const countryData = data.filter(item => item.country_name === countryToAnalyze);

if (countryData.length > 0) {
    // Calcular la media del campo numérico 'fert_15_19'
    const sum = countryData
        .map(item => item.fert_15_19)
        .reduce((acc, current) => acc + current, 0);

    const average = sum / countryData.length;

    // 3. Resultado por consola
    console.log(`La media de fertilidad (15-19 años) es: ${average.toFixed(2)}`);
} else {
    console.log(`No se encontraron datos para ${countryToAnalyze}`);
}
