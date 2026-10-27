// Tool that checks login tokens
import jwt from "jsonwebtoken";
// The user model (we check the user in the database on every request)
import User from "../model/UserModel.js";

// Put this before a route to make it PROTECTED (login required).
// It checks the token AND checks the user in the database,
// so blocked users and demoted admins lose access immediately.
const authMiddleware = async (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;

    // Check if token exists
    if (!authHeader) {
      return res.status(401).json({
        status: false,
        message: "Authentication required",
      });
    }

    // Check Bearer format
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: false,
        message: "Invalid authorization format",
      });
    }

    // Get token
    const token = authHeader.split(" ")[1];

    // Verify token (throws an error if it is fake or expired)
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Load the user from the database (fresh information)
    const user = await User.findById(decoded.userId).select(
      "role isActive isVerified passwordChangedAt"
    );

    // The user was deleted
    if (!user) {
      return res.status(401).json({
        status: false,
        message: "Invalid or expired token",
      });
    }

    // The user is blocked
    if (!user.isActive) {
      return res.status(403).json({
        status: false,
        message: "Your account has been deactivated",
      });
    }

    // The email is not verified
    if (!user.isVerified) {
      return res.status(403).json({
        status: false,
        message: "Please verify your email first",
      });
    }

    // If the password was changed after this token was created,
    // the token is not valid any more (the user must log in again)
    if (user.passwordChangedAt) {
      const changedAtSeconds = Math.floor(
        user.passwordChangedAt.getTime() / 1000
      );

      if (decoded.iat < changedAtSeconds) {
        return res.status(401).json({
          status: false,
          message: "Password was changed. Please log in again",
        });
      }
    }

    // Store authenticated user information.
    // The role comes from the DATABASE, not from the token.
    req.user = {
      userId: user._id.toString(),
      role: user.role,
    };

    // Continue to route
    next();

  } catch (error) {
    // A fake or expired token is a normal 401 case
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        status: false,
        message: "Invalid or expired token",
      });
    }

    // Anything else is a real problem (for example the database is down)
    console.log("Authentication error:", error);

    return res.status(500).json({
      status: false,
      message: "Authentication failed",
    });
  }
};

export default authMiddleware;
