// Settings file (has the MongoDB address)
import env from './env.js'
// Tool that talks to MongoDB
import mongoose from 'mongoose'

// MongoDB address from the .env file
const MONGO_URI = env.DATABASE.URI

// Connect to MongoDB (this runs when the file is imported)
const database = mongoose.connect(MONGO_URI).then(()=>{
    console.log("✅ Connected to MongoDB Database")
}).catch((err)=>{
    console.log("❌ Failed to connect to MongoDB:", err.message)

    // Stop the server. An API without a database is useless.
    process.exit(1)
})


export default database
