const EXPECTED_KEYS = ["country_code", "country_name", "year", "fert_15_19", "fert_20_24"];

export function isValidRecord(record) {
    const recordKeys = Object.keys(record);
    const hasAllKeys = EXPECTED_KEYS.every(key => recordKeys.includes(key));
    const hasExactLength = recordKeys.length === EXPECTED_KEYS.length;
    return hasAllKeys && hasExactLength;
}
