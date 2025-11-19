const request = require("supertest");
const { User } = require("../../models/UserModel");
const { closeServer } = require("../helpers/teardown");

let server;

describe("/api/users", () => {
  beforeEach(() => {
    server = require("../../api");
  });
  afterEach(async () => {
    await User.deleteMany({});
    await closeServer(server);
  });

  describe("GET /me", () => {
    let token;
    let user;

    const exec = () => {
      return request(server).get("/api/users/me").set("x-auth-token", token);
    };

    beforeEach(async () => {
      user = new User({
        name: "UserName",
        email: "email@email.com",
        password: "1234567890",
      });
      await user.save();

      token = user.generateAuthToken();
    });

    it("should return 401 if client is not logged in ", async () => {
      token = "";

      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return the user without password if it's valid", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
    });
  });

  describe("POST /", () => {
    let user;
    let newName;
    let email;
    let password;

    const exec = () => {
      return request(server)
        .post("/api/users")
        .send({ name: newName, email, password });
    };

    beforeEach(async () => {
      user = new User({
        name: "UserName",
        email: "email@email.com",
        password: "1234567890",
      });
      await user.save();

      newName = "PostUserName";
      email = "postEmail@email.com";
      password = "0987654321";
    });

    it("should return 400 if name is less than 3 characters", async () => {
      newName = "12";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if the email already exists", async () => {
      email = "email@email.com";

      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return the user without the password, and send by header the JWT token if it's valid", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty("password");
      expect(res.header).toHaveProperty("x-auth-token");
    });
  });
});
