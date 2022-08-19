const express = require("express");
const { categoryCtrl } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

router.route("/").get(protect, categoryCtrl.getCategory);
//Create new Note
router.route("/create").post(protect, categoryCtrl.createCategory);

//Category Id Delete

router
  .route("/:id")
  .get(categoryCtrl.getCategoryById)
  .delete(protect, categoryCtrl.DeleteCategory);

module.exports = router;
