const express = require("express");
const { messageCTRL } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

//Create new getMessage
router.route("/addmessage").post(protect, messageCTRL.addMessage);
//Get new getMessage
router.route("/getmessage").post(protect, messageCTRL.getMessage);

module.exports = router;
