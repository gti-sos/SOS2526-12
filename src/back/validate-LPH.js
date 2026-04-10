export function isValidRecord(record) {
    if (!record.country_code || record.country_code === "") return false;
    if (!record.country_name || record.country_name === "") return false;
    if (record.year === undefined || record.year === null || record.year === "" || isNaN(record.year)) return false;
    return true;
}
