const { Schema } = require("mongoose");

const orderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },
    customerId: { type: String },
    paymentIntentId: { type: String },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product" },
        price: { type: String },
        quantity: { type: Number },
      },
    ],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    shipping: { type: Object, required: true },
    delivery_status: { type: String, default: "pending" },
    payment_status: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = orderSchema;
