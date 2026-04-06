
import dataStore from 'nedb';

let db = new dataStore();

let initialRecords = [
    { country_code: "AF", country_name: "Afghanistan", year: 1979, sex: "Male", max_age: 100, population_age_0: 318425, population_age_25: 127876, population_age_50: 49804, population_age_75: 9729, population_age_100: 2 },
    { country_code: "AJ", country_name: "Azerbaijan", year: 1992, sex: "Female", max_age: 100, population_age_0: 108912, population_age_25: 67871, population_age_50: 31250, population_age_75: 4571, population_age_100: 3 },
    { country_code: "AJ", country_name: "Azerbaijan", year: 1990, sex: "Female", max_age: 100, population_age_0: 107574, population_age_25: 68932, population_age_50: 31252, population_age_75: 4594, population_age_100: 8 },
    { country_code: "AM", country_name: "Armenia", year: 1991, sex: "Female", max_age: 100, population_age_0: 37961, population_age_25: 31179, population_age_50: 19315, population_age_75: 4571, population_age_100: 37 },
    { country_code: "AN", country_name: "Andorra", year: 1991, sex: "Female", max_age: 100, population_age_0: 37961, population_age_25: 31179, population_age_50: 19315, population_age_75: 4571, population_age_100: 37 },
    { country_code: "AS", country_name: "Australia", year: 1986, sex: "Male", max_age: 100, population_age_0: 121872, population_age_25: 1367731, population_age_50: 76764, population_age_75: 32582, population_age_100: 163 },
    { country_code: "BA", country_name: "Bahrain", year: 1982, sex: "Male", max_age: 96, population_age_0: 5313, population_age_25: 6093, population_age_50: 1394, population_age_75: 168, population_age_100: 0 },
    { country_code: "BC", country_name: "Botswana", year: 1983, sex: "Male", max_age: 100, population_age_0: 20539, population_age_25: 6321, population_age_50: 2624, population_age_75: 991, population_age_100: 3 },
    { country_code: "BD", country_name: "Bermuda", year: 1992, sex: "Male", max_age: 99, population_age_0: 427, population_age_25: 506, population_age_50: 324, population_age_75: 100, population_age_100: 0 },
    { country_code: "BF", country_name: "Bahamas The", year: 1980, sex: "Male", max_age: 96, population_age_0: 2574, population_age_25: 17171, population_age_50: 628, population_age_75: 149, population_age_100: 0 }
];

db.insert(initialRecords, (err) => {
    if (err) console.error(err);

    function testQuery(req_query) {
        const query = {};
        let req_query_copy = JSON.parse(JSON.stringify(req_query));

        if (req_query_copy.from || req_query_copy.to) {
            query.year = {}; 
            if (req_query_copy.from) {
                query.year.$gte = parseInt(req_query_copy.from); 
                delete req_query_copy.from; 
            }
            if (req_query_copy.to) {
                query.year.$lte = parseInt(req_query_copy.to);   
                delete req_query_copy.to; 
            }
        }

        const operatorMap = { ">": "$gt", "<": "$lt", ">=": "$gte", "<=": "$lte" };
        const operators = [">=", "<=", ">", "<"];

        Object.keys(req_query_copy).forEach(key => {
            const value = req_query_copy[key];
            if (typeof value === "string" && value.includes("-")) {
                const [min, max] = value.split("-");
                query[key] = {};
                if (min !== "") query[key]["$gte"] = isNaN(min) ? min : Number(min);
                if (max !== "") query[key]["$lte"] = isNaN(max) ? max : Number(max);
                return;
            }
            for (const op of operators) {
                if (typeof value === "string" && value.startsWith(op)) {
                    const valStr = value.slice(op.length);
                    const valParsed = isNaN(valStr) ? valStr : Number(valStr);
                    if (!query[key]) query[key] = {};
                    query[key][operatorMap[op]] = valParsed;
                    return;
                }
            }
            query[key] = isNaN(value) ? value : Number(value);
        });

        console.log("Query constructed:", JSON.stringify(query));
        db.find(query, (err, records) => {
            if (err) console.error(err);
            console.log(`Found ${records.length} records for ${JSON.stringify(req_query)}`);
        });
    }

    testQuery({ from: "1980", to: "1990" });
    testQuery({ from: "1980" });
    testQuery({ to: "1985" });
    testQuery({ country_name: "Azerbaijan", from: "1990", to: "1992" });
});
