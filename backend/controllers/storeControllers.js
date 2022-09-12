const asyncHandler = require("express-async-handler");
const { Store, Order } = require("../models");
const { roles } = require("../fixtures");

const querypopulateItem = {
  path: "product",
  select: "title",
};
const querypopulateorder = {
  path: "orders",
  populate: {
    path: "orderId",
  },
};

//Get all Store
const getStores = asyncHandler(async (req, res) => {
  try {
    let query = [
      //   {
      //     $lookup: {
      //       from: "products",
      //       localField: "product",
      //       foreignField: "_id",
      //       as: "product",
      //     },
      //   },
      {
        $lookup: {
          from: "storeorders",
          localField: "orders",
          foreignField: "_id",
          as: "order",
        },
      },
      //   {
      //     $set: {
      //       "orderItems.product": "$product",
      //     },
      //   },
      //   {
      //     $group: {
      //       _id: "$_id",
      //       orderItems: { $push: "$orderItems" },
      //     },
      //   },
    ];
    const orders = await Store.aggregate(query);
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});
//get Merchant
const getMerchantStore = asyncHandler(async (req, res) => {
  try {
    const orders = await Store.find({ user: req.user.accountId });
    res.status(200).send(orders);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = {
  getStores,
  getMerchantStore,
};
