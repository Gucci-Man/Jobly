"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`);
    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    const jobsRes = await db.query(
        `SELECT id, title, salary, equity
        FROM jobs
        WHERE company_handle = $1
        ORDER BY id`,
      [handle],
    );

    company.jobs = jobsRes.rows;

    return company;
  }

  /** Filter by company name, maxEmployees or minEmployees. return data about that company
   * 
   *  Takes a filter keyword ("name", "minEmployees", "maxEmployees") and corresponding value
   * 
   *  Returns [{handle, name, description, logo_url}], includes numEmployees if applicable. 
   */

  static async getFilterOne(filter, value) {
    let predicate = null; // The predicate to filter. 
    let colName = null; // Name of column to filter by. Either name or num_employees.
    let queryString = null; // SQL query 
    let employeeCol = "" // Include employee column if filter is applicable. If not leave blank.
    let sqlValue = null; // Updates value dependent on filter

    //***  Filter by number of employees ***/
    if (filter === 'minEmployees' || filter === 'maxEmployees') {
      let valueInt = parseInt(value, 10);
      employeeCol = 'num_employees AS "numEmployees",'; 
      colName = 'num_employees'
      sqlValue = value; 

      if (isNaN(valueInt) || valueInt < 0) {
        throw new BadRequestError(`${filter} is either NaN or negative`);
      };

      if (filter === 'minEmployees') {
        predicate = '>=';
      } else if (filter === 'maxEmployees') {
        predicate = '<=';
      }
    };

    //*** Filter by name ***/
    if(filter === 'name') {
      colName = 'name';
      predicate = 'ILIKE';
      sqlValue = `'%${value}%'`;
    }
    
    queryString = 
        `SELECT handle,
          name,
          description,
          ${employeeCol}
          logo_url AS "logoUrl"
        FROM companies
        WHERE ${colName} ${predicate} ${sqlValue};`;
        
    const companyRes = await db.query(queryString);
    const companies = companyRes.rows;
    
    return companies;
  }

  /** Filter by company name and maxEmployees or minEmployees, return data about that company
   * 
   *  Returns [{handle, name, description, numEmployees logo_url}]
   */

  static async getFilterNameRange(name, min, max) {
    let firstPredicate = ''; // First predicate 
    let secondPredicate = ''; // Second predicate

    // if both min and max exist, include in filter
    if (min && max) {
      let minInt = parseInt(min, 10);
      let maxInt = parseInt(max, 10);

      if (isNaN(minInt) || minInt < 0) {
        throw new BadRequestError(`minEmployees is either NaN or negative`);
      } else if (isNaN(maxInt) || maxInt < 0) {
        throw new BadRequestError(`maxEmployees is either NaN or negative`);
      } else if (minInt > maxInt) {
        throw new BadRequestError('minEmployees cannot be more than maxEmployees');
      }

      firstPredicate = `num_employees >= ${minInt}`; // first predicate to filter out min employees
      secondPredicate = `AND num_employees <= ${maxInt}`; // second predicate to filter out max employees

    } else if (min) {
      let minInt = parseInt(min, 10);

      if (isNaN(minInt) || minInt < 0) {
        throw new BadRequestError(`minEmployees is either NaN or negative`); 
      };

      firstPredicate = `num_employees >= ${minInt}`;
  
    } else if (max) {
      let maxInt = parseInt(max, 10);

      if (isNaN(maxInt) || maxInt < 0) {
        throw new BadRequestError(`maxEmployees is either NaN or negative`); 
      };

      firstPredicate = `num_employees <= ${maxInt}`;
    }
     
    const queryString = 
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
    FROM companies
    WHERE name ILIKE '%${name}%' 
      AND ${firstPredicate} ${secondPredicate};`;

    const companyRes = await db.query(queryString);
    const companies = companyRes.rows;

    return companies;
  }

  /** Filter by minEmployees and maxEmployees, return data about that company
   * 
   *  Returns [{handle, name, description, numEmployees logo_url}]
   */

  static async getMinMax(min, max) {
    // Convert to an integer and check if valid
    let maxInt = parseInt(max, 10); 
    let minInt = parseInt(min, 10);

    if (isNaN(minInt) || minInt < 0) {
      throw new BadRequestError(`minEmployees is either NaN or negative`);
    };

    if (isNaN(maxInt) || maxInt < 0) {
      throw new BadRequestError(`maxEmployees is either NaN or negative`);
    };

    if (minInt > maxInt) {
      throw new BadRequestError(`minEmployees cannot be greater than maxEmployees`)
    };

    const queryString = 
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
    FROM companies
    WHERE num_employees >= ${minInt}
      AND num_employees <= ${maxInt};`;

    const companyRes = await db.query(queryString);
    const companies = companyRes.rows;

    return companies;
  };


  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
