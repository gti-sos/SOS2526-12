import { isValidRecord } from '../../src/back/validate-JJG.js';

const valid = {
    country_code: 'AF', country_name: 'Afghanistan', year: 1979,
    sex: 'Male', max_age: 100, population_age_0: 318425,
    population_age_25: 127876, population_age_50: 49804,
    population_age_75: 9729, population_age_100: 2
};

test('valid record passes', () => {
    expect(isValidRecord(valid)).toBe(true);
});

test('missing country_code fails', () => {
    const { country_code, ...rest } = valid;
    expect(isValidRecord(rest)).toBe(false);
});

test('missing sex fails', () => {
    const { sex, ...rest } = valid;
    expect(isValidRecord(rest)).toBe(false);
});

test('extra field fails', () => {
    expect(isValidRecord({ ...valid, extra_field: 'x' })).toBe(false);
});

test('missing population_age_100 fails', () => {
    const { population_age_100, ...rest } = valid;
    expect(isValidRecord(rest)).toBe(false);
});
