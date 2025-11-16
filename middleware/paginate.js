/**
 * Pagination Middleware
 *
 * Provides standardized pagination for GET endpoints.
 * Extracts page and limit from query parameters and adds helper method to response.
 *
 * Usage:
 *   router.get("/", paginate(), async (req, res) => {
 *     const { skip, limit } = req.pagination;
 *     const data = await Model.find().skip(skip).limit(limit);
 *     const total = await Model.countDocuments();
 *     res.paginatedResponse(data, total);
 *   });
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function paginate(options = {}) {
  const { defaultLimit = DEFAULT_LIMIT, maxLimit = MAX_LIMIT } = options;

  return (req, res, next) => {
    // Parse and validate page number
    const page = Math.max(1, parseInt(req.query.page) || DEFAULT_PAGE);

    // Parse and validate limit
    const limit = Math.min(
      maxLimit,
      Math.max(1, parseInt(req.query.limit) || defaultLimit)
    );

    // Calculate skip for MongoDB query
    const skip = (page - 1) * limit;

    // Attach pagination info to request
    req.pagination = {
      page,
      limit,
      skip,
    };

    // Helper method to send paginated response
    res.paginatedResponse = function (data, totalCount) {
      const totalPages = Math.ceil(totalCount / limit);

      return res.json({
        data,
        pagination: {
          page,
          limit,
          totalPages,
          totalItems: totalCount,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      });
    };

    next();
  };
}

module.exports = paginate;
