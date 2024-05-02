const express = require("express");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const cors = require("cors");
const mongoDB = require("mongoose");
const CORS_URL = `http://localhost:3000`;
const mongoURL = process.env.MONGODB_URL;

const router = express.Router();
const util = require("util");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const MongoClient = require("mongodb").MongoClient;
const GridFSBucket = require("mongodb").GridFSBucket;
// const URL = "mongodb://127.0.0.1:27017";
const URL = "mongodb+srv://sanskargour1234:Ua7BRnZnJm1QCNjb@cluster0.p5ccr6o.mongodb.net/";
const mongoClient = new MongoClient(URL);
const imgBucket = "photos";
const baseUrl = "http://localhost:5000/api/file/";

var storage = new GridFsStorage({
  url: URL,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    const match = ["image/png", "image/jpeg"];

    if (match.indexOf(file.mimetype) === -1) {
      const filename = `knowledge-hive--${file.originalname}`;
      return filename;
    }

    return {
      bucketName: imgBucket,
      filename: `knowledge-hive--${file.originalname}`
    };
  }
});

var uploadFiles = multer({ storage: storage }).single("file");
var uploadFilesMiddleware = util.promisify(uploadFiles);

app.use(
  cors({
    origin: CORS_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept"],
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, PUT");
  next();
});

mongoDB.connect(mongoURL , { useNewUrlParser: true, useUnifiedTopology: true }).then(function () {
  app.get("", (req, res) => {
    res.send("API Works");
  });
  app.use(express.json());
  app.use("/api", require("./routes/register"));
  app.use("/api/post", require("./routes/post"));
  app.use("/api/user", require("./routes/user"));
  app.use("/api/category", require("./routes/category"));

  app.post("/api/file/upload",async (req,res)=>{
    try {
      await uploadFilesMiddleware(req, res);
      console.log("Uploaded file:", req.file);
  
      if (req.file === undefined) {
        return res.send({
          message: "You must select a file.",
        });
      }
  
      return res.status(200).send({url : `${baseUrl}${req.file.filename}`});
    } catch (error) {
      console.log(error);
      return res.status(500).send(error);
    }
  });

  app.get("/api/file" , async (req, res)=>{
    try {  
      const database = mongoClient.db("test");
      const images = database.collection(imgBucket + ".files");      
      const cursor = images.find({});

      if ((await cursor.count()) === 0) {
        return res.status(500).send({
          message: "No files found!",
        });
      }
  
      let fileInfos = [];
      await cursor.forEach((doc) => {
        fileInfos.push({
          name: doc.filename,
          url: baseUrl + doc.filename,
        });
      });

      return res.status(200).send({url : `${baseUrl}${req.file.filename}`});
    } catch (error) {
      return res.status(500).send({
        message: error.message,
      });
    }
  })

  app.get("/api/file/:name" , async (req, res)=>{
    try {  
      const database = mongoClient.db("test");
      const bucket = new GridFSBucket(database, {
        bucketName: imgBucket,
      });
  
      let downloadStream = bucket.openDownloadStreamByName(req.params.name);
  
      downloadStream.on("data", function (data) {
        return res.status(200).write(data);
      });
  
      downloadStream.on("error", function (err) {
        return res.status(404).send({ message: "Cannot download the Image!" , error: err});
      });
  
      downloadStream.on("end", () => {
        return res.end();
      });
    } catch (error) {
      return res.status(500).send({
        message: error.message,
      });
    }
  })
});

app.listen(PORT,'0.0.0.0', (error) => {
  if (!error)
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT
    );
  else console.log("Error occurred, server can't start", error);
});
