const db = require("../db.js");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
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
        equity: 0.5,
        handle: "c1",
    };

    test("works", async function () {
        let job = await Job.create(newJob);
        expect(job).toEqual(newJob);

        const result = await db.query(
            `SELECT title, salary, equity, company_handle AS handle
            FROM jobs 
            WHERE title = 'New Tester'`);
            // equity is returned as a string with SQL query
        expect(result.rows).toEqual([
            {
                title: "New Tester",
                salary: 200,
                equity: '0.5',
                handle: "c1",
            }
        ]);
    });

    test("bad request with non-existent company", async function () {
        try {
            let job = await Job.create({
                title: "Tester",
                salary: 200,
                equity: 0.5,
                handle: "None",
            });
        } catch (err) {
            expect(err instanceof BadRequestError).toBeTruthy();
        }
    });

    test("bad request with duplicate job", async function () {
        try {
            await Job.create(newJob);
            await Job.create(newJob);
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
                title: "Tester 1",
                salary: 100,
                equity: 0,
                handle: "c1",
            },
            {
                title: "Tester 2",
                salary: 200,
                equity: 0.2,
                handle: "c2",
            },
            {
                title: "Tester 3",
                salary: 300,
                equity: 1,
                handle: "c3",
            },
        ]);
    });
});