const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const { sanitizeBody, sanitizeUpdate } = require("../middleware/sanitizeUpdate");
const paginate = require("../middleware/paginate");

const { Genre, validate } = require("../models/GenreModel");

router.get("/", paginate(), async (req, res) => {
  const { skip, limit } = req.pagination;

  const [genres, total] = await Promise.all([
    Genre.find({}).sort({ name: "asc" }).skip(skip).limit(limit),
    Genre.countDocuments({}),
  ]);

  res.paginatedResponse(genres, total);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) return res.status(404).send("This genre wasn't found.");
  res.send(genre);
});

// Middleware: auth → sanitizeBody → Joi validation → Mongoose schema
router.post("/", [auth, sanitizeBody], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let genre = new Genre({ name: req.body.name });
  genre = await genre.save();
  res.send(genre);
});

// Middleware: auth → validateObjectId → sanitizeUpdate → Joi validation
// Note: Explicit field selection ({ name }) prevents unintended updates
router.put("/:id", [auth, validateObjectId, sanitizeUpdate], async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = await Genre.findByIdAndUpdate(
    { _id: req.params.id },
    { name: req.body.name },
    { new: true }
  );
  if (!genre) return res.status(404).send("This genre wasn't found.");
  res.send(genre);
});

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const genre = await Genre.findByIdAndDelete({ _id: req.params.id });

  if (!genre) return res.status(404).send("This genre wasn't found.");

  res.send(genre);
});

module.exports = router;
