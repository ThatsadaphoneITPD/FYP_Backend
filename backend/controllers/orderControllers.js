const asyncHandler = require("express-async-handler");
const { Order } = require("../models");
const { roles } = require("../fixtures");

const getOrders = asyncHandler(async (req, res) => {
  const order = await Order.find();
  res.json(order);
});

const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: "order not found" });
  }

  res.json(order);
});

module.exports = { getOrders, getOrderById };
