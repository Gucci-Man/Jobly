
/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn } = require("../middleware/auth");
const Job = require("../models/job");

const  jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");

const router = new express.Router();


/** POST / { job } =>  { job }
 *
 * job should be { title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.post("/", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.create(req.body);
        return res.status(201).json({ job });
    } catch (err) {
        return next(err);
    }
});

// TODO: Create tests and add filtering
/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * 
 * - title: filter by job title. Case-insensitive, matches-any-part-of-string search.
 * 
 * - minSalary: filter to jobs with at least that salary.
 * 
 * - hasEquity: if true, filter to jobs that provide a non-zero amount of equity. 
 *      If false or not included in the filtering, list all jobs regardless of equity.
 *
 * Authorization required: none
 */

/* router.get("/", async function (req, res, next) {
    let jobs = null;
    try {
        if (req.query.title) {
            console.log("Filtering by job title...");
        } else {
            jobs = await Job.findAll();
        }

        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
}); */

router.get("/", async function (req, res, next) {
    const q = req.query;
    // arrive as strings from querystring, but we want as int/bool
    if (q.minSalary !== undefined) q.minSalary = +q.minSalary
    q.hasEquity = q.hasEquity === "true";

    try {
        const validator = jsonschema.validate(q, jobSearchSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const jobs = await Job.findAll(q);
        return res.json({ jobs });
    } catch (err) {
        return next(err);
    }
});

/** GET /[id]  =>  { job }
 *
 *  Job is { id, title, salary, equity, company_handle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
        const job = await Job.get(req.params.id);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches company data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: login
 */

router.patch("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
            const errs = validator.errors.map(e => e.stack);
            throw new BadRequestError(errs);
        }

        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: login
 */

router.delete("/:id", ensureLoggedIn, async function (req, res, next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: parseInt(req.params.id, 10) });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;