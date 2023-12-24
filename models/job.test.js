const db = require("../db.js");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: "New Tester",
        salary: 200,
        equity: '0.5',
        companyHandle: "c1",
    };

    test("works", async function () {
        await Job.create(newJob);

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle AS "companyHandle"
            FROM jobs 
            WHERE title = 'New Tester'`);
    
        expect(result.rows).toEqual([
            {
                ...newJob, 
                id: expect.any(Number),
            }
        ]);
    });

    test("bad request with non-existent company", async function () {
        try {
            await Job.create({
                title: "Tester",
                salary: 200,
                equity: '0.5',
                companyHandle: "None",
            });
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** findAll */

describe("findAll", function() {
    test("works: no filter", async function () {
        let jobs = await Job.findAll();
        expect(jobs).toEqual([
            {   
                id: testJobIds[0],
                title: "Tester 1",
                salary: 100,
                equity: '0',
                companyHandle: "c1",
            },
            {   
                id: testJobIds[1],
                title: "Tester 2",
                salary: 200,
                equity: '0.2',
                companyHandle: "c2",
            },
            {   
                id: testJobIds[2],
                title: "Tester 3",
                salary: 300,
                equity: '1',
                companyHandle: "c3",
            },
        ]);
    });
});

/************************************** get */

describe("get", function () {
    test("works", async function () {
        let job = await Job.get(testJobIds[0]);
        expect(job).toEqual({
            id: testJobIds[0],
            title: "Tester 1",
            salary: 100,
            equity: '0',
            companyHandle: "c1",
        });
    });

    test("not found if no such job exist", async function () {
        try {
            await Job.get(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
})

/************************************** update */

describe("update", function () {
    const updateData = {
        title: "New Tester",
        salary: 1000,
        equity: '0.3'
    };

    test("works", async function () {
        let job = await Job.update(testJobIds[0], updateData);
        expect(job).toEqual({
            id: testJobIds[0],
            companyHandle: "c1",
            ...updateData
        });
    });

    test("works: null fields", async function () {
        const updateDataSetNulls = {
            title: "New Tester",
            salary: null,
            equity: null,
        }

        let job = await Job.update(testJobIds[0], updateDataSetNulls);
        expect(job).toEqual({
            id: testJobIds[0],
            companyHandle: "c1",
            ...updateDataSetNulls
        });
    });

    test("not found if no such job id", async function () {
        try {
            await Job.update(0, updateData);
            fail();
        } catch (err) {
            console.log(`typeof of err is ${typeof err}`)
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });

    test("bad request with no data", async function() {
        try {
            await Job.update(testJobIds, {});
            fail();
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });
});

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        await Job.remove(testJobIds[0]);
        const res = await db.query(
            `SELECT * FROM jobs WHERE id = ${testJobIds[0]}`);
        expect(res.rows.length).toEqual(0);
    });

    test("not found if no such job id", async function() {
        try {
            await Job.remove(0);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});