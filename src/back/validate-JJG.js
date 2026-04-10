const EXPECTED_FIELDS = [
    "country_code", "country_name", "year", "sex", "max_age",
    "population_age_0", "population_age_25", "population_age_50",
    "population_age_75", "population_age_100"
];

export function isValidRecord(record) {
    const receivedFields = Object.keys(record);
    const hasAllFields = EXPECTED_FIELDS.every(field => receivedFields.includes(field));
    const hasExtraFields = receivedFields.length > EXPECTED_FIELDS.length;
    return hasAllFields && !hasExtraFields;
}
