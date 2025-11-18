const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateObjectId = require("../middleware/validateObjectId");
const { sanitizeBody, sanitizeUpdate } = require("../middleware/sanitizeUpdate");
const paginate = require("../middleware/paginate");

const { Genre, validate } = require("../models/GenreModel");

/**
 * @swagger
 * /api/genres:
 *   get:
 *     summary: Get all genres with pagination
 *     description: Returns a paginated list of movie genres sorted by name
 *     tags: [Genres]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Paginated list of genres
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Genre'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get("/", paginate(), async (req, res) => {
  const { skip, limit } = req.pagination;

  const [genres, total] = await Promise.all([
    Genre.find({}).sort({ name: "asc" }).skip(skip).limit(limit),
    Genre.countDocuments({}),
  ]);

  res.paginatedResponse(genres, total);
});

/**
 * @swagger
 * /api/genres/{id}:
 *   get:
 *     summary: Get a genre by ID
 *     description: Returns a single genre by its ID
 *     tags: [Genres]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre ID
 *     responses:
 *       200:
 *         description: Genre found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Genre'
 *       404:
 *         description: Genre not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", validateObjectId, async (req, res) => {
  const genre = await Genre.findById(req.params.id);
  if (!genre) {return res.status(404).send("This genre wasn't found.");}
  res.send(genre);
});

/**
 * @swagger
 * /api/genres:
 *   post:
 *     summary: Create a new genre
 *     description: Creates a new genre. Requires authentication.
 *     tags: [Genres]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: Sci-Fi
 *     responses:
 *       200:
 *         description: Genre created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Genre'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
// Middleware: auth → sanitizeBody → Joi validation → Mongoose schema
router.post("/", [auth, sanitizeBody], async (req, res) => {
  const { error } = validate(req.body);
  if (error) {return res.status(400).send(error.details[0].message);}

  let genre = new Genre({ name: req.body.name });
  genre = await genre.save();
  res.send(genre);
});

/**
 * @swagger
 * /api/genres/{id}:
 *   put:
 *     summary: Update a genre
 *     description: Updates an existing genre by ID. Requires authentication.
 *     tags: [Genres]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 50
 *                 example: Science Fiction
 *     responses:
 *       200:
 *         description: Genre updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Genre'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Middleware: auth → validateObjectId → sanitizeUpdate → Joi validation
// Note: Explicit field selection ({ name }) prevents unintended updates
router.put("/:id", [auth, validateObjectId, sanitizeUpdate], async (req, res) => {
  const { error } = validate(req.body);
  if (error) {return res.status(400).send(error.details[0].message);}

  const genre = await Genre.findByIdAndUpdate(
    { _id: req.params.id },
    { name: req.body.name },
    { new: true }
  );
  if (!genre) {return res.status(404).send("This genre wasn't found.");}
  res.send(genre);
});

/**
 * @swagger
 * /api/genres/{id}:
 *   delete:
 *     summary: Delete a genre
 *     description: Deletes a genre by ID. Requires authentication and admin privileges.
 *     tags: [Genres]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Genre ID
 *     responses:
 *       200:
 *         description: Genre deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Genre'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete("/:id", [auth, admin, validateObjectId], async (req, res) => {
  const genre = await Genre.findByIdAndDelete({ _id: req.params.id });

  if (!genre) {return res.status(404).send("This genre wasn't found.");}

  res.send(genre);
});

module.exports = router;
