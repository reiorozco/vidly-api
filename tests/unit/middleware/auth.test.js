const { User } = require("../../../models/UserModel");
const auth = require("../../../middleware/auth");
const mongoose = require("mongoose");

describe("auth middleware", () => {
  it("should populate req.user with the payload of a valid JWT", () => {
    const user = { _id: new mongoose.Types.ObjectId(), isAdmin: true };
    const token = new User(user).generateAuthToken();
    const req = {
      header: jest.fn().mockReturnValue(token),
    };
    const res = {};
    const next = jest.fn();

    auth(req, res, next);

    // Mongoose 8: ObjectId is serialized as string in JWT
    expect(req.user._id).toBe(user._id.toHexString());
    expect(req.user.isAdmin).toBe(user.isAdmin);
  });
});
