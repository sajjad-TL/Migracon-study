const crypto = require("crypto");

const generateResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const expires = Date.now() + 1000 * 60 * 30;

  return { token, hash, expires };
};

module.exports = generateResetToken;
