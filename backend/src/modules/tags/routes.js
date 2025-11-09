const express = require("express");
const pool = require("../../db");
const auth = require("../../mw/auth");
const { slugify } = require("../../utils/slugify");

const router = express.Router();

// ========================================
// GENERIC ROUTES (tags-related)
// ========================================

// GET / - Get all tags
router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM tags ORDER BY name ASC"
    );
    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Error in GET /tags:", err);
    next(err);
  }
});

// POST / - Create tag (auth, admin stub)
router.post("/", auth, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Name is required",
          errorCode: "MISSING_NAME",
        });
    }

    // Validate tag name - must not be purely numeric
    if (/^\d+$/.test(name.trim())) {
      return res.status(400).json({ ok: false, message: 'Tag name cannot be only numbers', errorCode: 'INVALID_TAG_NAME' });
    }

    // Validate tag name - must be at least 2 characters
    if (name.trim().length < 2) {
      return res.status(400).json({ ok: false, message: 'Tag name must be at least 2 characters', errorCode: 'TAG_TOO_SHORT' });
    }

    // Validate tag name - must not be purely numeric
    if (/^\d+$/.test(name.trim())) {
      return res.status(400).json({ ok: false, message: 'Tag name cannot be only numbers', errorCode: 'INVALID_TAG_NAME' });
    }

    // Validate tag name - must be at least 2 characters
    if (name.trim().length < 2) {
      return res.status(400).json({ ok: false, message: 'Tag name must be at least 2 characters', errorCode: 'TAG_TOO_SHORT' });
    }

    const slug = slugify(name);

    await pool.query(
      "INSERT INTO tags (name) VALUES (?) ON DUPLICATE KEY UPDATE name = name",
      [slug]
    );

    const [tags] = await pool.query("SELECT * FROM tags WHERE name = ?", [
      slug,
    ]);

    res.status(201).json({ ok: true, data: tags[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /:id - Update tag (auth, admin)
router.put("/:id", auth, async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({
          ok: false,
          message: "Name is required",
          errorCode: "MISSING_NAME",
        });
    }

    const slug = slugify(name);

    const [result] = await pool.query("UPDATE tags SET name = ? WHERE id = ?", [
      slug,
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          ok: false,
          message: "Tag not found",
          errorCode: "TAG_NOT_FOUND",
        });
    }

    const [tags] = await pool.query("SELECT * FROM tags WHERE id = ?", [
      req.params.id,
    ]);

    res.json({ ok: true, data: tags[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id - Delete tag (auth, admin)
router.delete("/:id", auth, async (req, res, next) => {
  try {
    // First delete all story_tags associations
    await pool.query("DELETE FROM story_tags WHERE tag_id = ?", [
      req.params.id,
    ]);

    // Then delete the tag
    const [result] = await pool.query("DELETE FROM tags WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({
          ok: false,
          message: "Tag not found",
          errorCode: "TAG_NOT_FOUND",
        });
    }

    res.json({ ok: true, message: "Tag deleted" });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
