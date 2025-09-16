require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const { MongoClient, GridFSBucket } = require("mongodb");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 5000;
const mongoURL = process.env.MONGODB_URL;

const morgan = require("morgan");
app.use(morgan("dev")); // Logs requests in concise format

// Cloudinary Config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Dynamic Base URL
const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}/api/file`;

// Mongo Client for GridFS
const mongoClient = new MongoClient(mongoURL);
const imgBucket = "photos";

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "./public/temp"),
  filename: (req, file, cb) => cb(null, `${file.originalname}-${Date.now()}`),
});
const upload = multer({ storage });

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
    credentials: true,
  })
);

app.use(express.json());

// Utility: Upload to Cloudinary
const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath); // Remove temp file
    return response;
  } catch (error) {
    console.log(error)
    fs.unlinkSync(localFilePath);
    return null;
  }
};

// MongoDB Connection
mongoose
  .connect(mongoURL)
  .then(() => {
    console.log("MongoDB connected");

    // Base route
    app.get("/", (req, res) => {
      res.send("API is running...");
    });

    // API Routes
    app.use("/api", require("./routes/register"));
    app.use("/api/post", require("./routes/post"));
    app.use("/api/user", require("./routes/user"));
    app.use("/api/category", require("./routes/category"));

    // Upload endpoint
    app.post("/api/file/upload", upload.single("post"), async (req, res) => {
      try {
        const postLocalPath = req.file?.path;

        if (!postLocalPath) {
          return res.status(400).send({ message: "No file selected" });
        }

        const post = await uploadToCloudinary(postLocalPath);

        if (!post) {
          return res.status(500).send({ message: "Upload failed" });
        }

        return res.status(200).send({ url: post.url });
      } catch (error) {
        console.error(error);
        return res.status(500).send(error);
      }
    });

    // Fetch all files info
    app.get("/api/file", async (req, res) => {
      try {
        const database = mongoClient.db("test");
        const images = database.collection(`${imgBucket}.files`);
        const cursor = images.find({});

        const count = await cursor.count();
        if (count === 0) {
          return res.status(404).send({ message: "No files found" });
        }

        const fileInfos = [];
        await cursor.forEach((doc) => {
          fileInfos.push({
            name: doc.filename,
            url: `${baseUrl}/${doc.filename}`,
          });
        });

        return res.status(200).send(fileInfos);
      } catch (error) {
        return res.status(500).send({ message: error.message });
      }
    });

    // Download a specific file
    app.get("/api/file/:name", async (req, res) => {
      try {
        const database = mongoClient.db("test");
        const bucket = new GridFSBucket(database, { bucketName: imgBucket });

        const downloadStream = bucket.openDownloadStreamByName(req.params.name);

        downloadStream.on("data", (data) => res.write(data));
        downloadStream.on("error", () =>
          res.status(404).send({ message: "Cannot download the image!" })
        );
        downloadStream.on("end", () => res.end());
      } catch (error) {
        return res.status(500).send({ message: error.message });
      }
    });

    // Start server
    app.listen(PORT, "0.0.0.0", (error) => {
      if (!error) {
        console.log(`Server running on port ${PORT}`);
      } else {
        console.error("Error starting server:", error);
      }
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });
