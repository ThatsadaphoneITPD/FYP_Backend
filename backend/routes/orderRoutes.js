const express = require("express");
const { orderCTRL } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
// const { isAuthentication } = require("../utils");

//Get Items's Datat from DB Query
router.route("/").get(protect, orderCTRL.getProducts);

// item action
router.route("/:id").get(orderCTRL.getOrderById).delete();

module.exports = router;
