const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const { sanitizeBody, sanitizeUpdate } = require("../middleware/sanitizeUpdate");
const paginate = require("../middleware/paginate");

const { Movie, validate } = require("../models/MovieModel");
const { Genre } = require("../models/GenreModel");

router.get("/", paginate(), async (req, res) => {
  const { skip, limit } = req.pagination;

  const [movies, total] = await Promise.all([
    Movie.find({}).sort({ name: "asc" }).skip(skip).limit(limit),
    Movie.countDocuments({}),
  ]);

  res.paginatedResponse(movies, total);
});

router.get("/:id", [validateObjectId], async (req, res) => {
  const movie = await Movie.find({ _id: req.params.id });

  if (!movie) return res.status(404).send("This movie wasn't found.'");

  res.send(movie);
});

router.post("/", [auth, sanitizeBody], async (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const genre = await Genre.findById({ _id: req.body.genreId });
  if (!genre) return res.status(400).send("Invalid genre.");

  const movie = new Movie({
    title: req.body.title,
    genre: {
      _id: genre._id,
      name: genre.name,
    },
    numberInStock: req.body.numberInStock,
    dailyRentalRate: req.body.dailyRentalRate,
  });
  await movie.save();

  res.send(movie);
});

router.put("/:id", [auth, validateObjectId, sanitizeUpdate], async (req, res) => {
  const { error, value } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const { title, genreId, numberInStock, dailyRentalRate } = req.body;

  const genre = await Genre.findById({ _id: genreId });
  if (!genre) return res.status(400).send("Invalid genre.");

  const movie = await Movie.findByIdAndUpdate(
    { _id: req.params.id },
    {
      title,
      genre: {
        _id: genre._id,
        name: genre.name,
      },
      numberInStock,
      dailyRentalRate,
    },
    { new: true }
  );
  if (!movie) return res.status(404).send("This movie wasn't found.");

  res.send(movie);
});

router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const movie = await Movie.findByIdAndDelete({ _id: req.params.id });

  if (!movie) return res.status(404).send("This movie wasn't found.'");

  res.send(movie);
});

module.exports = router;
