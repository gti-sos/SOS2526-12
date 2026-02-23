// 1. Datos inicializados desde tu ficha de trabajo

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



// 2. Algoritmo con iteradores

const geoFilter = "Azerbaijan"; // Filtro geográfico



// Usamos .filter() para obtener solo las filas de Azerbaijan

const filteredRows = data.filter(row => row.country_name === geoFilter);



// Usamos .map() para extraer solo los valores numéricos y luego calculamos la suma

const values = filteredRows.map(row => row.population_age_100);

const total = values.reduce((acc, current) => acc + current, 0);



// Calculamos la media

const average = filteredRows.length > 0 ? total / filteredRows.length : 0;



// 3. Resultado por consola

console.log(`Media de population_age_100 para ${geoFilter}: ${average}`);