const { model } = require("mongoose");
module.exports = {
  Account: model("Account", require("./Account")),
  Role: model("Role", require("./Role")),
  UserProfile: model("UserProfile", require("./User")),
  Product: model("Product", require("./Product")),
  Attachment: model("Attachment", require("./Attachment")),
  Category: model("Category", require("./Category")),
  Order: model("Order", require("./Order")),
  Store: model("Store", require("./Store")),
  StoreOrder: model("StoreOrder", require("./StoreOrder")),
  Message: model("Message", require("./Message")),
};
