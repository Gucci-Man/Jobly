const { BadRequestError } = require("../expressError");

/**
 * SQL for Partial Update
 * 
 * This module provides a utility function for generating SQL for a partial update
 * based on the given data and a mapping of JavaScript property names to SQL column names.
 * 
**/

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  // Get the keys (property names) from the data to be updated.
  const keys = Object.keys(dataToUpdate);

  // Check if there is no data to update, and throw a BadRequestError if so.
  if (keys.length === 0) {
    throw new BadRequestError("No data");
  }

  // Generate an array of SQL expressions for the SET clause based on the data and the mapping.
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  // Return an object with the generated SQL setCols and the corresponding values.
  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
