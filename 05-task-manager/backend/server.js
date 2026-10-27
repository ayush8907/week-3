
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// User model
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
  })
);

// Task model
const Task = mongoose.model(
  "Task",
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true },
      description: { type: String, default: "" },
      status: {
        type: String,
        enum: ["Pending", "In Progress", "Completed"],
        default: "Pending",
      },
      dueDate: { type: Date, default: null },
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { timestamps: true }
  )
);

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
}

// Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must contain at least 6 characters.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Registration successful.",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Email is already registered." });
    }
    res.status(500).json({ message: "Server error during registration." });
  }
});

// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch {
    res.status(500).json({ message: "Server error during login." });
  }
});

// Get all tasks, with optional status filtering
app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const filter = { userId: req.user.id };

    if (req.query.status && req.query.status !== "All") {
      if (!["Pending", "In Progress", "Completed"].includes(req.query.status)) {
        return res.status(400).json({ message: "Invalid task status." });
      }
      filter.status = req.query.status;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json(tasks);
  } catch {
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});

// Create a task
app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const { title, description = "", status = "Pending", dueDate = null } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required." });
    }

    if (!["Pending", "In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid task status." });
    }

    const task = await Task.create({
      title: title.trim(),
      description,
      status,
      dueDate: dueDate || null,
      userId: req.user.id,
    });

    res.status(201).json(task);
  } catch {
    res.status(500).json({ message: "Failed to create task." });
  }
});

// Update a task
app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const updates = {};
    const { title, description, status, dueDate } = req.body;

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim()) {
        return res.status(400).json({ message: "Task title cannot be empty." });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) updates.description = description;

    if (status !== undefined) {
      if (!["Pending", "In Progress", "Completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid task status." });
      }
      updates.status = status;
    }

    if (dueDate !== undefined) updates.dueDate = dueDate || null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task updated successfully.", task });
  } catch {
    res.status(400).json({ message: "Could not update task. Check the task ID and values." });
  }
});

// Delete a task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found." });
    }

    res.json({ message: "Task deleted successfully." });
  } catch {
    res.status(400).json({ message: "Invalid task ID." });
  }
});

// Basic health check
app.get("/", (req, res) => {
  res.send("Task Manager API is running!");
});

// Connect to MongoDB, then start the server
async function startServer() {
  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    console.error("Missing MONGO_URI or JWT_SECRET in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`Task Manager API running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
