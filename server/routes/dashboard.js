// ============================================================
// WRO Philippines DBMS – Dashboard Statistics Routes
// Provides pre-aggregated data for dashboard charts so the
// frontend never has to do expensive client-side grouping.
// ============================================================

const express = require('express');
const router  = express.Router();
const pool    = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

// ── GET /api/dashboard/participation ─────────────────────────
// Returns unique student and team counts grouped by year.
// Year is extracted from the team's season field (e.g. "WRO 2025" → 2025).
// Also merges in season years that have 0 participation so the chart
// always shows a complete, consistent x-axis.
router.get('/participation', async (req, res) => {
  try {
    // Step 1: Get participation counts from teams + team_members join.
    // RIGHT(season, 4) reliably extracts the 4-digit year for all known
    // season name formats ("WRO 2025", "WRO_2025", "2025", etc.)
    const [participationRows] = await pool.execute(`
      SELECT
        RIGHT(t.season, 4)            AS year,
        COUNT(DISTINCT t.id)          AS teams,
        COUNT(DISTINCT tm.student_id) AS students
      FROM   teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      WHERE  t.is_deleted = 0
        AND  t.season IS NOT NULL
        AND  t.season != ''
        AND  RIGHT(t.season, 4) REGEXP '^[0-9]{4}$'
      GROUP  BY year
      ORDER  BY year ASC
    `);

    // Step 2: Get all years from the seasons reference table (may include
    // seasons that have no teams yet so they show as 0 on the chart).
    const [seasonRows] = await pool.execute(
      'SELECT DISTINCT CAST(year AS CHAR) AS year FROM seasons WHERE year IS NOT NULL ORDER BY year ASC'
    );

    // Step 3: Merge — seasons table provides the baseline year set;
    // participationRows fills in the actual counts.
    const yearMap = {};

    seasonRows.forEach(r => {
      if (r.year && r.year.length === 4) {
        yearMap[r.year] = { year: r.year, teams: 0, students: 0 };
      }
    });

    participationRows.forEach(r => {
      const y = String(r.year);
      yearMap[y] = {
        year:     y,
        teams:    parseInt(r.teams,    10) || 0,
        students: parseInt(r.students, 10) || 0,
      };
    });

    const result = Object.values(yearMap)
      .sort((a, b) => a.year.localeCompare(b.year));

    res.json(result);
  } catch (err) {
    console.error('[Dashboard] /participation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
