const asyncHandler = require("express-async-handler");
const { Order } = require("../models");
const { roles } = require("../fixtures");

const querypopulateorder = {
  path: "products",
  populate: {
    path: "productId",
    select: "title price attachments",
    populate: {
      path: "attachments",
      select: "online_url",
      options: {
        limit: [0],
      },
    },
  },
};

const getOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find().populate(querypopulateorder);
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});
//get User order
const getShoperOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.accountId }).populate(
      querypopulateorder
    );
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});
//get Order ID
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  try {
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: "order not found" });
    }
  } catch (err) {
    res.status(505).send(err);
  }
});
//Edite
const updateOrder = asyncHandler(async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).send(updatedOrder);
  } catch (err) {
    res.status(500).send(err);
  }
});
const editCancelOrder = asyncHandler(async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order.user.toString() !== req.user.accountId.toString()) {
      res.status(401);
      throw new Error("You can't perform this action");
    }

    if (order) {
      //change order's statue false to ture
      order.cancel = true;

      const updatedorder = await order.save();
      res.json({
        message: "Successfull Update Order!",
        updateCancle: updatedorder,
      });
    } else {
      res.status(404).send({ message: "Not Found Order to Update" });
      throw new Error("order not found");
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
//delete
const delecteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  try {
    if (order) {
      await order.remove();
      res
        .json({ message: `${order.customerId} order's Removed` })
        .then(res.status(200).send("Order has been deleted..."));
    } else {
      res.status(404).json({ message: "order not Found" });
    }
  } catch (err) {
    res.status(505).send(err);
  }
});
//

module.exports = {
  getOrders,
  getOrderById,
  delecteOrder,
  getShoperOrders,
  updateOrder,
  editCancelOrder,
};
