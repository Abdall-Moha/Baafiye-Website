// Built-in Node.js tool for secure random values
import crypto from "crypto";

// Creates the random token that goes inside the reset link (email)
export const GenerateResetToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Turns a token into a hash (a fingerprint).
// We save only the hash in the database, so if someone reads the
// database they still cannot use the tokens.
export const HashResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};
