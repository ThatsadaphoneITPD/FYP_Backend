const express = require("express");
const { productCtrl } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const { paginatedResults } = require("../middlewares/pagination");
const { Product } = require("../models");
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

//Router Search without Auth login
router.route("/items/all").get(paginatedResults(Product), (req, res) => {
  res.json(res.paginatedResults);
});
router.route("/search/:key").get(productCtrl.getProductSearch);
router.route("/category/item").get(productCtrl.getProSearchCategory);
router.route("/searchAll").get(productCtrl.getProSearchALL);

module.exports = router;
