const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    default: "Anonymous",
    required: true,
  },
  lastName: {
    type: String,
    default: "",
    // required: true,
  },
  age: {
    type: Number,
    min: 1,
    max: 50,
    default: 1,
  },
  email: {
    type: String,
    unique: true,
  },
  phone: {
    type: String,
    // required: true,
  },
  address: {
    type: String,
  },
  introduction: String,
  gender: String,
  account: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Account",
    required: true,
  },
});

module.exports = userSchema;
