
async function runTests() {
    const baseUrl = 'http://localhost:3000/api/v2/mid-population-ages';

    // 1. Load initial data
    await fetch(`${baseUrl}/loadInitialData`);
    console.log("Initial data loaded.");

    // 2. Test range search
    async function testRange(from, to, expectedCount) {
        let url = baseUrl;
        let query = [];
        if (from) query.push(`from=${from}`);
        if (to) query.push(`to=${to}`);
        if (query.length > 0) url += '?' + query.join('&');

        const res = await fetch(url);
        const data = await res.json();
        console.log(`Search from=${from} to=${to}: Found ${data.length} records. Expected: ${expectedCount}`);
        if (data.length !== expectedCount) {
            console.error("FAIL: Count mismatch!");
            process.exit(1);
        }
    }

    // Records years: 1979, 1992, 1990, 1991, 1991, 1986, 1982, 1983, 1992, 1980 (wait, let me re-check)
    /*
        1979 (AF)
        1992 (AJ)
        1990 (AJ)
        1991 (AM)
        1991 (AN)
        1986 (AS)
        1982 (BA)
        1983 (BC)
        1992 (BD)
        1980 (BF)
    */
    // Years: 1979, 1980, 1982, 1983, 1986, 1990, 1991, 1991, 1992, 1992
    
    await testRange(1980, 1990, 5); // 1980, 1982, 1983, 1986, 1990
    await testRange(1991, 1992, 4); // 1991, 1991, 1992, 1992
    await testRange(1970, 1979, 1); // 1979
    await testRange(1993, 2000, 0); // None
    await testRange(1980, null, 9); // All except 1979
    await testRange(null, 1980, 2); // 1979, 1980

    console.log("All range tests PASSED!");
    process.exit(0);
}

runTests();
