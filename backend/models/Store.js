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
        ref: "Product",
      },
    ],
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "StoreOrder",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = storeSchema;
