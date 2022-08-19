const express = require("express");
const cors = require("cors");
const notes = require("./data/notes");
const dotenv = require("dotenv");
const { connectDB } = require("./config");
dotenv.config();
const {
  userRoutes,
  productRoutes,
  noteRoutes,
  categoryRotes,
  stripeRotes,
} = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { multer, isAuthentication } = require("./utils");
const { protect } = require("./middlewares/authMiddleware");

const app = express();
app.use(cors());
connectDB();

app.use(express.urlencoded({ extended: true })); // supporting the encoded url parser
app.use(express.json());

// API/note

app.get("/", (req, res) => {
  res.send("API is running");
});

//serve backend to fontend

// app.get("/api/datanotes", (req, res) => {
//   res.json(notes);
// });

// app.get("/api/datanotes/:id", (req, res) => {
//   const note = notes.find((n) => n._id === req.params.id);
//   res.send(note);
// });

//API account user Register and Login

app.use("/api/users", userRoutes);

//API Product Create/Edit/delete

app.use("/api/notes", noteRoutes);

//API Product Create/Edit/delete

app.use("/api/products", protect, multer.array("files"), productRoutes);
//API categories
app.use("/api/categories", categoryRotes);

//APT Stripe Payment
app.use("/api/stripe", stripeRotes);
// ------------------- Error Handler -------------------------
app.use(notFound);
app.use(errorHandler);

// ------------------ Server Port -----------------------------
const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`server start at port ${PORT}`));
