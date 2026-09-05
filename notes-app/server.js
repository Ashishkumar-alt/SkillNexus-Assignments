const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const User = require("./User");
const Note = require("./Note");
const authMiddleware = require("./authMiddleware");

const app = express();

app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((error) => {
    console.log("MongoDB connection error:", error.message);
  });

// Home route
app.get("/", (req, res) => {
  res.send("Notes App API is running");
});

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// CREATE NOTE
app.post("/api/notes", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.create({
      title,
      content,
      userId: req.userId
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// GET ALL NOTES
app.get("/api/notes", authMiddleware, async (req, res) => {
  try {
    const notes = await Note.find({
      userId: req.userId
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// UPDATE NOTE
app.put("/api/notes/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content } = req.body;

    const note = await Note.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.userId
      },
      {
        title,
        content
      },
      {
        new: true
      }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.json(note);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});

// DELETE NOTE
app.delete("/api/notes/:id", authMiddleware, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found"
      });
    }

    res.json({
      message: "Note deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
});
app.get("/test", (req, res) => {
  res.send("TEST ROUTE WORKING");
});
// START SERVER
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});