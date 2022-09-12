const express = require("express");
const { orderCTRL } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
// const { isAuthentication } = require("../utils");

//Get Items's Data from DB Query
router.route("/").get(orderCTRL.getOrders);
//Get Shoper order
router.route("/shoper/items").get(protect, orderCTRL.getShoperOrders);
//Get Shoper order by ID and action cancel
router
  .route("/shoper/order/:id")
  .get(orderCTRL.getOrderById)
  .put(protect, orderCTRL.editCancelOrder);

// Order Action for Admin CRUD
router
  .route("/:id")
  .get(orderCTRL.getOrderById)
  .delete(protect, orderCTRL.delecteOrder);

module.exports = router;
