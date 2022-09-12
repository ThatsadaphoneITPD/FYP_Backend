const { Schema } = require("mongoose");

const storeorderSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    price: { type: String },
    shop: { type: Schema.Types.ObjectId, ref: "Store" },
    delivery_status: { type: String, default: "pending" },
    received_status: { type: Boolean, default: false },
    quantity: { type: Number },
    shipping: { type: Object, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = storeorderSchema;
