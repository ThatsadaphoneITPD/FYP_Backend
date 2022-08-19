const { Schema } = require("mongoose");

const storeSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
    orders: [
      {
        type: Schema.Types.ObjectId,
        ref: "Order",
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = storeSchema;
