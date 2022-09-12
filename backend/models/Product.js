const { Schema } = require("mongoose");

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    user: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
    store: {
      type: Schema.Types.ObjectId,
      ref: "Store",
    },
    attachments: [
      {
        type: Schema.Types.ObjectId,
        ref: "Attachment",
      },
    ],
  },
  {
    timestamps: true,
  }
);

productSchema.pre(["findByIdAndRemove"], function (next) {
  this.model("Attachment").remove({ _id: { $in: "$attachments" } }, next);
});
productSchema.pre(["findByIdAndUpdate", "findOneAndUpdate"], function (next) {
  this.model("Attachment").remove({ _id: { $in: "$attachments" } }, next);
});

module.exports = productSchema;
