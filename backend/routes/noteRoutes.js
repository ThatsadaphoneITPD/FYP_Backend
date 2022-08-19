const express = require("express");
const { noteCtrl } = require("../controllers");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");

router.route("/").get(protect, noteCtrl.getNotes);
//Create new Note
router.route("/create").post(protect, noteCtrl.createNote);

router
  .route("/:id")
  .get(noteCtrl.getNoteById)
  .put(protect, noteCtrl.UpdateNote)
  .delete(protect, noteCtrl.DeleteNote);

module.exports = router;
