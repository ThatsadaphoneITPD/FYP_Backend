const express = require("express");
const cors = require("cors");
const notes = require("./data/notes");
const dotenv = require("dotenv");
const socket = require("socket.io");
const { connectDB } = require("./config");
dotenv.config();
const {
  userRoutes,
  productRoutes,
  categoryRotes,
  stripeRotes,
  orderRotes,
  storeRotes,
  messageRotes,
} = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorMiddleware");
const { multer } = require("./utils");
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

//API account user Register and Login

app.use("/api/users", userRoutes);

//API Product Create/Edit/delete
//refresh agian

app.use("/api/products", protect, multer.array("files"), productRoutes);
app.use("/api/productSearch", productRoutes);
//API categories
app.use("/api/categories", categoryRotes);
//API order
app.use("/api/orders", orderRotes);
//API Store
app.use("/api/stores", storeRotes);
//API Stripe Payment
app.use("/api/stripe", stripeRotes);
//API Message
app.use("/api/messages", messageRotes);
// ------------------- Error Handler -------------------------
app.use(notFound);
app.use(errorHandler);

// ------------------ Server Port -----------------------------
const PORT = process.env.PORT || 5000;
// ------------User API server at Port-------------------
const server = app.listen(PORT, console.log(`server start at port ${PORT}`));
//------------- connect server with Socket port ------------
const io = socket(server, {
  cors: {
    origin: "https://ec-market.netlify.app",
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  // console.log("a user connected");
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    // console.log("user disconnected");
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
