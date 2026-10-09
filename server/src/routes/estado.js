const express = require('express');
const { query } = require('../db');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT current_database() AS base');
    res.json({ ok: true, base: rows[0].base });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
