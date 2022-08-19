const { Schema, model, SchemaTypes, Types } = require("mongoose");

const accountSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      maxlength: 100,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default:
        "https://static.xx.fbcdn.net/assets/?revision=816167972411634&name=desktop-workplace-your-profile-icon&density=1",
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    isAdmin: {
      type: Boolean,
      required: true,
      default: false,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      require: true,
    },
    // newNotification: { type: Boolean, default: false },
    refreshToken: String,
  },
  {
    timestamps: true,
  }
);

module.exports = accountSchema;
