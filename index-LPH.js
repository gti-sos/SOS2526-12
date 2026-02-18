// index-LPH.js

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
    const sum = paisData
        .map(item => item.crude_birth_rate)
        .reduce((acc, current) => acc + current, 0);

    const media = sum / paisData.length;

    console.log(`Datos de ${pais}:`);
    paisData.forEach(item => console.log(`  ${item.year}: ${item.crude_birth_rate}`));
    console.log(`Media de crude_birth_rate: ${media.toFixed(2)}`);
} else {
    console.log(`No hay datos para: ${pais}`);
}