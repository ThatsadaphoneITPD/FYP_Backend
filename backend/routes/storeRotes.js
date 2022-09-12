const express = require("express");
const { storeCTRL } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

//Get Items's Data from DB Query
router.route("/").get(storeCTRL.getStores);
//Get Shoper order

module.exports = router;
