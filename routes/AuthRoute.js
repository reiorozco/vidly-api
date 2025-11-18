const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");

const { User } = require("../models/UserModel");
const validate = require("../middleware/validate");
const { authLimiter } = require("../startup/rateLimiting");

function validateAuth(req) {
  const schema = Joi.object({
    email: Joi.string().email({
      minDomainSegments: 2,
      tlds: { allow: ["com", "net"] },
    }),
    password: Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
      .required(),
  });

  return schema.validate(req);
}

router.post("/", [authLimiter, validate(validateAuth)], async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {return res.status(400).send("Invalid email or password.");}

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) {return res.status(400).send("Invalid email or password.");}

  const token = user.generateAuthToken();

  res.send(token);
});

module.exports = router;
