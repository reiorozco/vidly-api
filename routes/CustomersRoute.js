const express = require("express");
const router = express.Router();

const { Customer, validateCustomer } = require("../models/CustomerModel");
const validateObjectId = require("../middleware/validateObjectId");
const auth = require("../middleware/auth");
const validate = require("../middleware/validate");
const { sanitizeBody, sanitizeUpdate } = require("../middleware/sanitizeUpdate");
const paginate = require("../middleware/paginate");

router.get("/", [auth, paginate()], async (req, res) => {
  const { skip, limit } = req.pagination;

  const [customers, total] = await Promise.all([
    Customer.find({}).sort({ name: "asc" }).skip(skip).limit(limit),
    Customer.countDocuments({}),
  ]);

  res.paginatedResponse(customers, total);
});

router.get("/:id", [auth, validateObjectId], async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) return res.status(404).send("This customer wasn't found.");
  res.send(customer);
});

router.post("/", [auth, sanitizeBody, validate(validateCustomer)], async (req, res) => {
  const { isGold, name, phone } = req.body;
  let customer = new Customer({ isGold, name, phone });
  customer = await customer.save();
  res.send(customer);
});

router.put(
  "/:id",
  [auth, validateObjectId, sanitizeUpdate, validate(validateCustomer)],
  async (req, res) => {
    const { isGold, name, phone } = req.body;
    const customer = await Customer.findByIdAndUpdate(
      { _id: req.params.id },
      { isGold, name, phone },
      { new: true }
    );

    if (!customer) return res.status(404).send("This customer wasn't found.");

    res.send(customer);
  }
);

router.delete("/:id", [auth, validateObjectId], async (req, res) => {
  const customer = await Customer.findByIdAndDelete({ _id: req.params.id });

  if (!customer) return res.status(404).send("This customer wasn't found.");

  res.send(customer);
});

module.exports = router;
