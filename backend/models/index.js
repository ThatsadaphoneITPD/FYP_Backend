const { model } = require("mongoose");
module.exports = {
  Account: model("Account", require("./Account")),
  Role: model("Role", require("./Role")),
  UserProfile: model("UserProfile", require("./User")),
  Notification: model("Notification", require("./Notification")),
  Product: model("Product", require("./Product")),
  Attachment: model("Attachment", require("./Attachment")),
  Category: model("Category", require("./Category")),
  Note: model("Note", require("./noteModel")),
  Order: model("Order", require("./Order")),
};