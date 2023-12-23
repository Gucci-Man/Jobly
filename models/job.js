/**
 * Jobs model
 */

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
    /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * */

    static async create({title, salary, equity, company_handle}) {
        // Check if company exist, if not throw error
        const companyCheck = await db.query(
            `SELECT handle 
            FROM companies 
            WHERE handle = $1`,
            [company_handle]);

        if (!companyCheck.rows[0])
            throw new BadRequestError(`Company doesn't exist: ${company_handle}`);

        const job = await db.query(
            `INSERT INTO jobs 
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING id, title, salary, equity, company_handle;`,
            [title, salary, equity, company_handle]);

        return job;
    };

    /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, company_handle }
   *   where jobs is [{ id, title, salary, equity, company_handle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT id,
                title,
                salary,
                equity,
                company_handle
            FROM jobs
            WHERE id = $1`,
            [id]);

        const job = jobRes.rows[0];

        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        return job;
    }


    /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * */

    static async findAll() {
        const jobsRes = await db.query(
            `SELECT id, 
            title, 
            salary, 
            equity, 
            company_handle 
            FROM jobs
            ORDER BY id`);

        return jobsRes.rows;
    };

    /** Filter by job title, minSalary or equity, return data about that job.
   *
   * Takes a filter keyword ("title", "minSalary", "hasEquity") and corresponding value.
   * 
   * Returns [{ title, salary, equity, company_handle },...]
   *  
   * Throws NotFoundError if not found.
   **/

    // TODO Create Get jobs with filters!!!!


    /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }. 
   * 
   * Cannot change the ID of a job, nor the company handle
   *
   * Returns { id, title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(data, {});
        const idVarIdx = "$" + (values.length + 1);

        const querySql = `UPDATE jobs
                            SET ${setCols}
                            WHERE id = ${idVarIdx}
                            RETURNING id,
                                    title,
                                    salary,
                                    equity,
                                    company_handle`;
        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];

       
        if (!job) throw new NotFoundError(`No job with id: ${id}`);

        return job;
    };
}


module.exports = Job;