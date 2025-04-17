const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers?.authorization;

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = jwt.verify(token, process.env.jwt_secret_key);
    console.log("Decoded Token: ", decodedToken);
    const agentId = decodedToken.agentId;
    if (agentId) {
      next();
    }
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Error authenticating login staus. Try again later",
        error: error.message,
      });
  }
};

module.exports = { authenticateUser };
