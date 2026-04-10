import { isValidRecord } from '../../src/back/validate-FMG.js';

const valid = {
    country_code: 'SI', country_name: 'Slovenia',
    year: 2022, fert_15_19: 7.5, fert_20_24: 56.4
};

test('valid record passes', () => {
    expect(isValidRecord(valid)).toBe(true);
});

test('missing country_code fails', () => {
    const { country_code, ...rest } = valid;
    expect(isValidRecord(rest)).toBe(false);
});

test('missing fert_15_19 fails', () => {
    const { fert_15_19, ...rest } = valid;
    expect(isValidRecord(rest)).toBe(false);
});

test('missing fert_20_24 fails', () => {
    const { fert_20_24, ...rest } = valid;
    expect(isValidRecord(rest)).toBe(false);
});

test('extra field fails', () => {
    expect(isValidRecord({ ...valid, extra: 'x' })).toBe(false);
});

test('missing year fails', () => {
    const { year, ...rest } = valid;
    expect(isValidRecord(rest)).toBe(false);
});
