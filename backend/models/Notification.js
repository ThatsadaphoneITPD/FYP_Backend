const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  from: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Account",
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now(),
  },
  message: {
    type: String,
  },
  url: String,
  type: String,
});

module.exports = notificationSchema;
