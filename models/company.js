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

    return company;
  }

  /** Filter by company name, return data about that company
   * 
   *  Returns [{handle, name, description, logo_url}]
   */

  static async getName(name) {
    const queryString = 
    `SELECT handle,
            name,
            description,
            logo_url AS "logoUrl"
    FROM companies
    WHERE name ILIKE '%${name}%';`;

    const companyRes = await db.query(queryString);
    const companies = companyRes.rows;

    return companies;
  }

  /** Filter by company minEmployees, return data about that company
   * 
   *  Returns [{handle, name, description, numEmployees logo_url}]
   */

  static async getMin(min) {
    // Convert to an integer and check if valid
    let minInt = parseInt(min, 10); 
    if (isNaN(minInt) || minInt < 0) {
      throw new ExpressError(`minEmployees is either NaN or negative`);
    };

    const queryString = 
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
    FROM companies
    WHERE num_employees >= ${minInt};`;

    const companyRes = await db.query(queryString);
    const companies = companyRes.rows;

    return companies;
  }

  /** Filter by company maxEmployees, return data about that company
   * 
   *  Returns [{handle, name, description, numEmployees logo_url}]
   */

  static async getMax(max) {
    // Convert to an integer and check if valid
    let maxInt = parseInt(max, 10); 

    if (isNaN(maxInt) || maxInt < 0) {
      throw new ExpressError(`maxEmployees is either NaN or negative`);
    };

    const queryString = 
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
    FROM companies
    WHERE num_employees <= ${maxInt};`;

    const companyRes = await db.query(queryString);
    const companies = companyRes.rows;

    return companies;
  }

  /** Filter by company name and minEmployees, return data about that company
   * 
   *  Returns [{handle, name, description, numEmployees logo_url}]
   */

  static async getNameMin(name, min) {
    // Convert to an integer and check if valid
    let minInt = parseInt(min, 10); 

    if (isNaN(minInt) || minInt < 0) {
      throw new ExpressError(`minEmployees is either NaN or negative`);
    };

    const queryString = 
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
    FROM companies
    WHERE name ILIKE '%${name}%'
      AND num_employees >= ${minInt};`;

    const companyRes = await db.query(queryString);
    const companies = companyRes.rows;

    return companies;
  }

  /** Filter by company name and maxEmployees, return data about that company
   * 
   *  Returns [{handle, name, description, numEmployees logo_url}]
   */

  static async getNameMax(name, max) {
    // Convert to an integer and check if valid
    let maxInt = parseInt(max, 10); 

    if (isNaN(maxInt) || maxInt < 0) {
      throw new ExpressError(`maxEmployees is either NaN or negative`);
    };

    const queryString = 
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
    FROM companies
    WHERE name ILIKE '%${name}%'
      AND num_employees <= ${maxInt};`;

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
      throw new ExpressError(`minEmployees is either NaN or negative`);
    };

    if (isNaN(maxInt) || maxInt < 0) {
      throw new ExpressError(`maxEmployees is either NaN or negative`);
    };

    if (minInt > maxInt) {
      throw new ExpressError(`minEmployees cannot be greater than maxEmployees`)
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

  /** Filter by name, minEmployees and maxEmployees, return data about that company
   * 
   *  Returns [{handle, name, description, numEmployees logo_url}]
   */

  static async getFilterAll(name, min, max) {
    // Convert to an integer and check if valid
    let maxInt = parseInt(max, 10); 
    let minInt = parseInt(min, 10);

    if (isNaN(minInt) || minInt < 0) {
      throw new ExpressError(`minEmployees is either NaN or negative`);
    };

    if (isNaN(maxInt) || maxInt < 0) {
      throw new ExpressError(`maxEmployees is either NaN or negative`);
    };

    if (minInt > maxInt) {
      throw new ExpressError(`minEmployees cannot be greater than maxEmployees`)
    };

    const queryString = 
    `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
    FROM companies
    WHERE name ILIKE '%${name}%' 
      AND num_employees >= ${minInt}
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
