const express = require("express");
const { productCtrl } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
// const { isAuthentication } = require("../utils");

//Get Items's Datat from DB Query
router.route("/").get(protect, productCtrl.getProducts);

// Create New item
router
  .route("/create")
  // .get((req, res) => res.status(200).send("add new productions"))
  .post(protect, productCtrl.CreateProduct);

// item action
router
  .route("/:id")
  .get(productCtrl.getProductById)
  .put(protect, productCtrl.UpdateProduct)
  .delete(protect, productCtrl.DeleteProduct);

router
  .route("/attachment/:id")
  .get(protect, productCtrl.getAttachmentsById)
  .delete(protect, productCtrl.DeleteAttachmetsById);

module.exports = router;
