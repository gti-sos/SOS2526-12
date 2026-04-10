import { isValidRecord } from '../../src/back/validate-LPH.js';

test('valid record passes validation', () => {
    expect(isValidRecord({ country_code: 'ES', country_name: 'Spain', year: 2022 })).toBe(true);
});

test('missing country_code fails', () => {
    expect(isValidRecord({ country_name: 'Spain', year: 2022 })).toBe(false);
});

test('empty country_code fails', () => {
    expect(isValidRecord({ country_code: '', country_name: 'Spain', year: 2022 })).toBe(false);
});

test('missing country_name fails', () => {
    expect(isValidRecord({ country_code: 'ES', year: 2022 })).toBe(false);
});

test('missing year fails', () => {
    expect(isValidRecord({ country_code: 'ES', country_name: 'Spain' })).toBe(false);
});

test('non-numeric year fails', () => {
    expect(isValidRecord({ country_code: 'ES', country_name: 'Spain', year: 'abc' })).toBe(false);
});

test('null year fails', () => {
    expect(isValidRecord({ country_code: 'ES', country_name: 'Spain', year: null })).toBe(false);
});
