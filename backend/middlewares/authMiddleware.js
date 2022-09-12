const { Account, Role, Store } = require("../models");
const { Token } = require("../utils");
const asyncHandler = require("express-async-handler");

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      //decodes token id
      const tokenData = Token.verifyToken(token);
      if (!tokenData?.id) throw new Error("Token is expired!");

      const account = await Account.findById(tokenData.id).select("-password");
      const role = await Role.findById(tokenData.roleId);
      req.user = {
        accountId: account.id,
        email: account.email,
        accessToken: token,
        account: account.username,
        role: role.roleName,
        accountId: account._id,
        profileImage: account.profileImage,
        shop: account.shop,
        // roleId: role._id,
        // workspace: account.workspace,
      };

      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

module.exports = { protect };
