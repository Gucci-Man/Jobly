// Tests for jobs routes

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token, // non-admin user token
  u2Token, // admin user token
  testJobIds, 
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe("POST /jobs", function () {
    const newJob = {
        title: 'Green Tester',
        salary: 500,
        equity: '0.9',
        companyHandle: 'c1',
    };

    test("Fail for non-admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("Pass for Admin users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                ...newJob
            }
        });
    });

    test("Bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                salary: 1000,
                equity: '0',
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("Bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                ...newJob,
                salary: 'Wrong',
                title: null,
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
    test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
            jobs: 
                [
                    {   
                        id: testJobIds[0],
                        title: 'Tester 1',
                        salary: 100,
                        equity: '0',
                        companyHandle: 'c1',
                        companyName: 'C1',
                    },
                    {   
                        id: testJobIds[1],
                        title: 'Tester 2',
                        salary: 200,
                        equity: '0.5',
                        companyHandle: 'c2',
                        companyName: 'C2',
                    },
                    {   
                        id: testJobIds[2],
                        title: 'Tester 3',
                        salary: 300,
                        equity: '0.1',
                        companyHandle: 'c3',
                        companyName: 'C3',
                    },
                ]
        });
    });
});

/************************************** GET /jobs/:id */

describe("GET /jobs/:id", function () {
    test("works for anon", async function () {
        const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
        expect(resp.body).toEqual({
            job: {   
                id: testJobIds[0],
                title: 'Tester 1',
                salary: 100,
                equity: '0',
                companyHandle: 'c1',
            },
        });
    });

    test("not found for no such job", async function () {
        const resp = await request(app).get('/jobs/0');
        expect(resp.statusCode).toEqual(404)
    });
});

/************************************** PATCH /jobs/:id */

describe("PATCH /jobs/:id", function () {
    test("works for admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: 'Changed Tester'
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
            job: {
                id: testJobIds[0],
                title: 'Changed Tester',
                salary: 100,
                equity: '0',
                companyHandle: 'c1',
            },
        });
    });

    test("unauth for non-admin users", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: 'Changed Tester'
            })
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[0]}`)
            .send({
                title: 'Changed Tester'
            });
        expect(resp.statusCode).toEqual(401);
    });

    test("bad request on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/0`)
            .send({
                title: 'Changed Tester'
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });

    test("bad request on id change attempt", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[1]}`)
            .send({
                id: 100,
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });

    test("bad request on invalid data", async function () {
        const resp = await request(app)
            .patch(`/jobs/${testJobIds[1]}`)
            .send({
                equity: "Wrong",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
    });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/id", function () {
    test("works for admins", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[0]}`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({ deleted: testJobIds[0]});
    });

    test("unauth for non-admin users", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[1]}`)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("unauth for anon", async function () {
        const resp = await request(app)
            .delete(`/jobs/${testJobIds[1]}`);
        expect(resp.statusCode).toEqual(401);
    });

    test("not found for no such job", async function () {
        const resp = await request(app)
            .delete(`/jobs/0`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
    });
});