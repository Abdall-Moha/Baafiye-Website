// The found item model
import FoundItem from "../model/FoundItem.js";

// Changes old items from "active" to "expired".
// It runs when the server starts, and then every hour (see index.js).
// The public routes ALSO check expiresAt themselves, so an expired item
// disappears at once, even if this job has not run yet.
//
// Pending items are never touched: they are not "active" and
// their expiresAt is null until the admin approves them.
export const expireFoundItems = async () => {
  try {

    // Find every active item whose expiry date has passed
    // and change its status to "expired"
    const result = await FoundItem.updateMany(
      {
        status: "active",
        expiresAt: {
          $ne: null,
          $lte: new Date(),
        },
      },
      {
        $set: {
          status: "expired",
        },
      }
    );

    console.log(
      `Expired items updated: ${result.modifiedCount}`
    );

  } catch (error) {
    console.log(
      "Expire found items error:",
      error
    );
  }
};