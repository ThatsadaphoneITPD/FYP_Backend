const asyncHandler = require("express-async-handler");
const { Store, Product, StoreOrder } = require("../models");
const { roles } = require("../fixtures");
const ObjectID = require("mongodb").ObjectId;

//Get all Store
const getStores = asyncHandler(async (req, res) => {
  try {
    let query = [
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $lookup: {
          from: "storeorders",
          localField: "orders",
          foreignField: "_id",
          as: "order",
        },
      },
    ];
    const orders = await Store.aggregate(query);
    res.status(200).send({ data: orders, message: "Success all Store" });
  } catch (err) {
    res.status(500).send(err);
  }
});

const fastSearchStores = asyncHandler(async (req, res) => {
  try {
    let query = [
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "attachments",
          localField: "product.attachments",
          foreignField: "_id",
          as: "product.attachments",
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "product.category",
        },
      },
      {
        $group: {
          _id: "$_id",
          storename: { $first: "$storename" },
          merchant: { $first: "$merchant" },
          productlist: {
            $push: {
              _id: "$product._id",
              title: "$product.title",
              content: "$product.content",
              price: "$product.price",
              category: "$product.category.name",
              attachments: "$product.attachments",
            },
          },
        },
      },
    ];
    if (req.query.keyword && req.query.keyword != "") {
      query.push({
        $match: {
          $or: [{ storename: { $regex: new RegExp(req.query.keyword, "i") } }],
        },
      });
    }
    const store = await Store.aggregate(query);
    // console.log(store);
    res.status(200).send({ stores: store, message: "Success all Store" });
  } catch (err) {
    res.status(500).send(err);
  }
});

//get Merchant
const getMerchantStore = asyncHandler(async (req, res) => {
  try {
    const querypopulateItem = {
      path: "product",
      select: "title user price category attachments content",
      populate: {
        path: "attachments category",
        select: "online_url name",
      },
    };
    const querypopulateseller = {
      path: "merchant",
      select: "username email",
    };
    const querypopulateorder = {
      path: "orders",
      populate: {
        path: "productId",
        select: "title price attachments category content",
        populate: {
          path: "attachments category",
          select: "online_url name",
          options: {
            limit: [0],
          },
        },
      },
    };
    let query = [querypopulateItem, querypopulateseller, querypopulateorder];
    const myStore = await Store.find({ merchant: req.user.accountId }).populate(
      query
    );
    if (myStore.length !== 0) {
      res.status(200).send(myStore);
    } else {
      res.status(200).send({
        message: "Fail loading Store",
      });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
//get single Store Order by id
const getStoreOrderById = asyncHandler(async (req, res) => {
  let query = [
    {
      $match: {
        $or: [
          {
            _id: ObjectID(req.query.keyid),
          },
        ],
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "orderItem",
      },
    },
  ];

  const orderItem = await StoreOrder.aggregate(query);
  try {
    if (orderItem.length !== 0) {
      res.status(200).json({
        data: orderItem,
        message: "orderItem Sucsessfuly found",
      });
    } else {
      res.status(404).json({ message: "orderItem not found" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
//Merchant Update Task of delivery status
const UpdateDeliveryOrderItemById = asyncHandler(async (req, res) => {
  try {
    const orderItem = await StoreOrder.findById(req.query.keyid);
    const delivery = req.query.delivery;
    console.log(orderItem);
    if (orderItem.length !== 0) {
      orderItem.delivery_status = `${delivery}`;
      const updatedorder = await orderItem.save();
      console.log(updatedorder);
      res.status(200).json({
        data: updatedorder,
        message: `OrderItem's ${delivery} !!`,
      });
    } else {
      res.status(404).json({ message: "orderItem not found" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

//Shoper get OrderItem one by one
const shoperReciveOrderItemById = asyncHandler(async (req, res) => {
  try {
    const orderItem = await StoreOrder.findById(req.query.keyid);
    console.log(orderItem);
    if (orderItem.length !== 0) {
      orderItem.received_status = true;
      const updatedorder = await orderItem.save();
      console.log(updatedorder);
      res.status(200).json({
        data: updatedorder,
        message: `OrderItem's recived by Buyer !!`,
      });
    } else {
      res.status(404).json({ message: "orderItem not found" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});
//Shoper Search for Merchant Store
const getStoreSearchALL = asyncHandler(async (req, res, next) => {
  const querypopulateItem = {
    path: "product",
    select: "_id title price attachments content",
    populate: {
      path: "attachments",
      select: "online_url",
    },
  };
  const querypopulateseller = {
    path: "merchant",
    select: "username email",
  };
  let query = [querypopulateItem, querypopulateseller];
  try {
    const store = await Store.find({
      storename: req.query.keyword,
    }).populate(query);
    // .populate(querypopulateseller);
    if (store) {
      res.status(200).send({
        message: "successfully fetch Search Store",
        searchdata: store,
      });
    } else {
      res.status(200).send({
        message: "Not Found Store",
      });
    }
  } catch (err) {
    return res.status(401).json({
      error: err.message,
    });
  }
});
const getSaleStore = asyncHandler(async (req, res) => {
  try {
    let query = [
      {
        $match: {
          $or: [{ merchant: req.user.accountId }],
        },
      },
      {
        $lookup: {
          from: "storeorders",
          localField: "orders",
          foreignField: "_id",
          as: "order",
        },
      },
      { $unwind: "$order" },
      {
        $lookup: {
          from: "products",
          localField: "order.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "product.category",
        },
      },
      { $unwind: "$product.category" },
      {
        $group: {
          _id: "$_id",
          salelist: {
            $push: {
              _id: "$order._id",
              name: "$product.title",
              price: "$order.price",
              value: { $avg: "$order.quantity" },
              total: {
                $sum: { $multiply: ["$order.price", "$order.quantity"] },
              },
              date: "$order.updatedAt",
            },
          },
          totalSaleAmount: {
            $sum: { $multiply: ["$order.price", "$order.quantity"] },
          },

          countAllSale: { $count: {} },
          categoriedSale: {
            $push: {
              _id: "$order._id",
              name: "$product.category.name",
              value: { $sum: 1 },
            },
          },
        },
      },
    ];
    let queryPro = [
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "categories",
          localField: "product.category",
          foreignField: "_id",
          as: "product.category",
        },
      },
      { $unwind: "$product.category" },
      {
        $group: {
          _id: "$_id",
          name: { $first: "$product.title" },
          category: { $first: "$product.category.name" },
          value: { $sum: 1 },
        },
      },
    ];
    const store = await Store.aggregate(query);
    const globalMarket = await Product.aggregate(queryPro);
    res.status(200).send({
      sale: store,
      market: globalMarket,
      message: "Getting Store sale",
    });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});

module.exports = {
  getStores,
  getMerchantStore,
  getStoreOrderById,
  UpdateDeliveryOrderItemById,
  shoperReciveOrderItemById,
  getStoreSearchALL,
  fastSearchStores,
  getSaleStore,
};
