const { Pool } = require('pg');
require('dotenv').config();

const { DATABASE_URL } = process.env;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;

// 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
// const pool = new Pool({
//     user : 'postgres',
//     password : '1234',
//     host : 'localhost',
//     port : 5432,
//     database : 'question_set'
// })