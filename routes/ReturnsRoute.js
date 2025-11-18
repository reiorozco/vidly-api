const express = require("express");
const router = express.Router();
const Joi = require("joi");

const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { Rental } = require("../models/RentalModel");
const { Movie } = require("../models/MovieModel");

//Validate
const validateReturn = (req) => {
  const schema = Joi.object({
    customerId: Joi.objectId().required(),
    movieId: Joi.objectId().required(),
  });

  return schema.validate(req);
};

router.post("/", [auth, validate(validateReturn)], async (req, res) => {
  const rental = await Rental.lookup(req.body.customerId, req.body.movieId);
  if (!rental) {return res.status(404).send("Rental not found.");}

  if (rental.dateReturned)
    {return res.status(400).send("Return already processed.");}

  rental.returnMovie();
  await rental.save();

  await Movie.updateOne(
    { _id: rental.movie._id },
    { $inc: { numberInStock: 1 } }
  );

  return res.send(rental);
});

module.exports = router;
