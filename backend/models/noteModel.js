const { Schema, model } = require("mongoose");

const noteSchema = Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Account",
    },
  },
  {
    timestamps: true,
  }
);

// const Note = model("Note", noteSchema);

module.exports = noteSchema;
