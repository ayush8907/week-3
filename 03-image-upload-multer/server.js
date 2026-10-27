
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5002;

// Allow requests from our frontend
app.use(cors());
app.use(express.json());

// Create the uploads folder automatically
const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure where uploaded images will be stored
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9);

    cb(null, uniqueName + path.extname(file.originalname));
  },
});

// Accept image files only, with a 5 MB limit
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

// Make uploaded images accessible through URLs
app.use("/uploads", express.static(uploadDir));

// Test route
app.get("/", (req, res) => {
  res.send("Image Upload API is running!");
});

// Upload route
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "Please select an image to upload.",
    });
  }

  res.status(201).json({
    message: "Image uploaded successfully!",
    image: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: `http://localhost:${PORT}/uploads/${req.file.filename}`,
    },
  });
});

// Handle upload errors
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image size must not exceed 5 MB."
        : err.message;

    return res.status(400).json({ message });
  }

  if (err) {
    return res.status(400).json({ message: err.message });
  }

  next();
});

app.listen(PORT, () => {
  console.log(`Image Upload API running at http://localhost:${PORT}`);
});
