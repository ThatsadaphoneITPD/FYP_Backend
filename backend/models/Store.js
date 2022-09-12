const { Schema } = require("mongoose");

const storeSchema = new Schema(
  {
    storename: { type: String },
    merchant: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
    product: [
      {
        type: Schema.Types.ObjectId,
        ref: "Account",
      },
    ],
    orders: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Order" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = storeSchema;
