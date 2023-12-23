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
   * Returns { title, salary, equity, company_handle }
   *
   * */

    static async create({title, salary, equity, handle}) {
        // Check if company exist, if not throw error
        const companyCheck = await db.query(
            `SELECT handle 
            FROM companies 
            WHERE handle = $1`,
            [handle]);

        if (!companyCheck.rows[0])
            throw new BadRequestError(`Company doesn't exist: ${handle}`);
        
        // Check if job already exist, if it does throw error
        const jobCheck = await db.query(
            `SELECT company_handle AS handle, title
            FROM jobs 
            WHERE company_handle = $1 
            AND title = $2`, 
            [handle, title]);
        
        if (jobCheck.rows[0])
            throw new BadRequestError(`Job already exist: ${title}`);

        const result = await db.query(
            `INSERT INTO jobs 
            (title, salary, equity, company_handle)
            VALUES ($1, $2, $3, $4)
            RETURNING title, salary, equity, company_handle AS handle;`,
            [title, salary, equity, handle]);

        // convert equity to a float type
        const job = result.rows[0];
        job.equity = parseFloat(job.equity);

        return job;
    };

    /** Find all jobs.
   *
   * Returns [{ title, salary, equity, company_handle }, ...]
   * */

    static async findAll() {
        const jobsRes = await db.query(
            `SELECT title, 
            salary, 
            equity, 
            company_handle AS handle
            FROM jobs
            ORDER BY title`);

        // convert equity to a float type
        for (let job of jobsRes.rows) {
            job.equity = parseFloat(job.equity);
        }
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

}


module.exports = Job;