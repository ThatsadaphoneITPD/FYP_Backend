const express = require("express");
const { userCtrl } = require("../controllers");
const router = express.Router();
const {
  protect,
  verifyRefreshToken,
} = require("../middlewares/authMiddleware");

//1. Get All Account

router.route("/").get(protect, userCtrl.getAccounts);
//Get Homepage Auth
// 2. User Profile

router
  .route("/profile/user")
  .get(protect, userCtrl.getOneUser)
  .put(protect, userCtrl.UpdateRole);

// 3. New User register as Shopper
router.route("/register").post(userCtrl.registerUser);
router
  .route("/addrole")
  .get((req, res) => res.status(200).send("access role"))
  .post(userCtrl.addrole);

router.route("/roles").get(userCtrl.getRole);

// 4. user login base on Role
router
  .route("/login")
  .get(function (req, res) {
    if (req.user) {
      return res.status(200).json({
        isLoggedIn: true,
        ...req.user,
      });
    }
    return res.json({
      message: "Login first",
    });
  })
  .post(userCtrl.login);
// 5. user Token
router.route("/token").post(userCtrl.checkToken);

// 6. User Logout
router.route("/logout").get(userCtrl.logout);

module.exports = router;
