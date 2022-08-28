const asyncHandler = require("express-async-handler");
const { Category } = require("../models");
const { roles } = require("../fixtures");

const getCategory = asyncHandler(async (req, res) => {
  const category = await Category.find();
  res.json(category);
});

const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  if (category) {
    res.json(category);
  } else {
    res.status(404).json({ message: "Category not found" });
  }
});

const createCategory = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Please Fill all the feilds");
    return;
  } else {
    const category = new Category({
      name,
    });

    const createdCategory = await category.save();

    res.status(201).json(createdCategory);
  }
});

const DeleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);

  // if ( req.user._id.toString() !== user.admin ) {
  //   res.status(401);
  //   throw new Error("You can't perform this action");
  // }

  if (category) {
    await category.remove();
    res.json({ message: `${category.name} Category Removed` });
  } else {
    res.status(404);
    throw new Error("Category not Found");
  }
});

module.exports = {
  getCategory,
  createCategory,
  getCategoryById,
  DeleteCategory,
};
