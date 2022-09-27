const express = require("express");
const { storeCTRL } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

//Get Items's Data from DB Query
router.route("/").get(storeCTRL.getStores);
//Get User Merchant Store
router.route("/merchentshop").get(protect, storeCTRL.getMerchantStore);
//Get User Merchant sale
router.route("/shopsale").get(protect, storeCTRL.getSaleStore);
//Get Shoper 's each  orderItem id is received the goods
router
  .route("/shoper/recive_order")
  .put(protect, storeCTRL.shoperReciveOrderItemById);
// Order Merchent orderItem id by Action delivery "Pending", "Sending", "Arrive".
router
  .route("/orderitem/item")
  .get(storeCTRL.getStoreOrderById)
  .put(protect, storeCTRL.UpdateDeliveryOrderItemById);
//shoper search for Store name by Find()
router.route("/searchSrore/all").get(storeCTRL.getStoreSearchALL);
//SeachAll Store Aggegate()
router.route("/search/storeAll").get(storeCTRL.fastSearchStores);

module.exports = router;
