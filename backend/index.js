// Express (the web framework)
import express from 'express'
// Lets your React website call this API
import cors from 'cors'
// Adds security headers to every response
import helmet from 'helmet'
// Connects to MongoDB (the connection starts when this file is imported)
import database from './config/database.js'
// Settings (port, frontend address...)
import env from './config/env.js'
// Routes
import userRouter from './routes/UserRoute.js'
import categoryRouter from "./routes/CategoryRoute.js";
import foundItemRouter from "./routes/FoundItemRoute.js";
import adminRouter from "./routes/AdminRoute.js";
// Job that expires old items
import { expireFoundItems } from "./job/expireFoundItems.js";
// Limit for all /api routes
import { generalLimiter } from "./middleware/rateLimiter.js";
// Folder where the uploaded pictures are saved
import { uploadsDir } from "./middleware/imageUploadMiddleware.js";

const app = express()

// Behind a hosting service (Render, Railway...) this lets the rate limiter
// see the REAL visitor IP instead of the IP of the hosting service
if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1)
}

// Middleware

// Security headers
app.use(helmet())

// Only your frontend website may call this API from a browser
app.use(cors({ origin: env.FRONTEND_URL }))

// Show the uploaded pictures: GET /uploads/<file name>
// Helmet blocks images from other websites by default,
// so we allow it here, otherwise your React site cannot show them
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin")
    next()
  },
  express.static(uploadsDir, {
    index: false,
    maxAge: "7d",
  })
)

// Read JSON from the request (maximum 10kb, so nobody sends huge data)
// (pictures are NOT affected, multer reads them in the route)
app.use(express.json({ limit: "10kb" }))

// Handles broken JSON and too big requests
app.use((error, req, res, next) => {
  // The frontend sent broken JSON
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({
      status: false,
      message: "Invalid JSON in request body",
    })
  }

  // The request is too big
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      status: false,
      message: "Request body is too large",
    })
  }

  // Any other request error
  return res.status(400).json({
    status: false,
    message: "Invalid request",
  })
})

// If the request has no body, use an empty one (Express 5 leaves it undefined)
app.use((req, res, next) => {
  if (!req.body) {
    req.body = {}
  }

  next()
})

// General limit for every /api route
app.use("/api", generalLimiter)



// Run once when server starts
expireFoundItems();

// Run every hour
setInterval(() => {
  expireFoundItems();
}, 60 * 60 * 1000);


// Routes
app.use('/api/auth', userRouter)
app.use("/api/categories", categoryRouter);
app.use("/api/items", foundItemRouter);
app.use("/api/admin", adminRouter);

// Wrong URL (no route matched)
app.use((req, res) => {
  return res.status(404).json({
    status: false,
    message: "Route not found",
  })
})


const PORT = env.PORT

app.listen(PORT, () =>{
    console.log(`Server is running on port ${PORT}`)
})