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
        company_handle: "c1",
    };

    test("works", async function () {
        await Job.create(newJob);

        const result = await db.query(
            `SELECT id, title, salary, equity, company_handle
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
                company_handle: "None",
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
                company_handle: "c1",
            },
            {   
                id: testJobIds[1],
                title: "Tester 2",
                salary: 200,
                equity: '0.2',
                company_handle: "c2",
            },
            {   
                id: testJobIds[2],
                title: "Tester 3",
                salary: 300,
                equity: '1',
                company_handle: "c3",
            },
        ]);
    });
});

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
            company_handle: "c1",
            ...updateData
        });
    })

})