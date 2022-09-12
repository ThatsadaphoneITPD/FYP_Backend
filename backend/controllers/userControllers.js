const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const express = require("express");
const bcryptjs = require("bcryptjs");
const { Account, Role, UserProfile, Store } = require("../models");
const { Token, isAuthentication } = require("../utils");
const { roles } = require("../fixtures");
let tokenList = [];

// 1. Get all acount DB by admin

const getAccounts = asyncHandler(async (req, res) => {
  try {
    const account = await Account.find()
      .select({
        username: 1,
        email: 1,
        createdAt: 1,
        role: 1,
        profileImage: 1,
      })
      .populate({ path: "role", select: "roleName" });
    res.json(account);
  } catch (err) {
    return res.status(401).json({
      error: err.message,
    });
  }
});

// 2. get All ROle base of User
const getRole = asyncHandler(async (req, res) => {
  try {
    const role = await Role.find();
    res.json(role);
  } catch (err) {
    return res.status(401).json({
      error: err.message,
    });
  }
});

const addrole = asyncHandler(async function (req, res) {
  const { roleName } = req.body;
  if (!roleName) throw new Error("Please input your roleName");
  return Role.create({
    roleName,
  }).then((data) =>
    res.status(201).json({
      message: "Created role successfully!",
      payload: data,
    })
  );
});
// 3. Get user Profile
const getProfileById = asyncHandler(async function (req, res) {
  const { accountid } = req.query;
  if (!accountid)
    return res.status(400).json({ error: "send your request information" });

  const foundAccount = await Account.findById(accountid, "", {
    select: { profileImage: 1, username: 1, email: 1, role: 1 },
    populate: { path: "role", select: { _id: 0, roleName: 1 } },
  }).exec();
  const foundProfile = await UserProfile.findOne({ account: accountid }).exec();

  const promise = Promise.all([foundAccount, foundProfile]);

  return promise
    .then((data) => {
      const [foundAccount, foundProfile] = data;
      return res.status(200).json({
        message: "get user profile successfully",
        response: { ...foundProfile._doc, ...foundAccount._doc },
      });
    })
    .catch((error) => res.status(500).json({ error: "Get profile failed!" }));
});

const updateUserProfile = asyncHandler(async function (req, res) {
  const user = await Account.findById(req.user.accountId);
  const profile = await UserProfile.findOne({ account: req.user.accountId });

  try {
    if (user) {
      user.name = req.body.username || user.username;
      user.email = req.body.email || user.email;
      user.profileImage = req.body.profileImage || user.profileImage;

      const updatedUser = await user.save();
      let token = new Token({
        id: updatedUser._id,
      });
      let accessToken = token.createToken();
      return res.status(200).json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        isAdmin: updatedUser.isAdmin,
        token: accessToken,
        profile,
      });
    }
  } catch (err) {
    return res.status(err.status || 500).json({
      error: err.message,
    });
  }
});
//4. Register new Account as Shopper

const registerUser = asyncHandler(async function (req, res) {
  const {
    username,
    email,
    password,
    profileImage,
    role = roles.SHOPPER,
  } = req.body;

  try {
    // 1. Validate email and password input are empty
    if (!email) throw new Error("Please fulfill your email");
    if (!password) throw new Error("Please input your password");

    const duplicateUser = await Account.findOne({ email: email }).exec();
    const isAbsoluteRoleName = Object.entries(roles).some(
      ([key, value]) => value === role
    );

    let assignedRole;
    if (isAbsoluteRoleName) {
      assignedRole = await Role.findOne({ roleName: role }).exec();
    } else if (!isAbsoluteRoleName) {
      assignedRole = await Role.findById(role).exec();
    }
    // 2. Validate user is duplicate and role is existed
    if (duplicateUser) throw new Error("User has Already been exist");
    if (!assignedRole)
      throw new Error("There are no capable role to authorize");

    // 3. Create and save new Account to database
    return Account.create(
      {
        username: username,
        password: await bcryptjs.hash(password, 10),
        email: email,
        profileImage:
          profileImage ||
          "https://laptrinhcuocsong.com/images/anh-vui-lap-trinh-vien-7.png",
        role: assignedRole && assignedRole._id,
      },
      async function (error, doc) {
        if (error) {
          return res.status(500).send(error.message);
        }
        // 5. Create a new Token and send to user for the further authentication
        let token = new Token({
          id: doc._id,
          roleId: doc.role,
        });
        let accessToken = token.createToken();
        const duplicatePF = await UserProfile.findOne({
          email: doc.email,
        }).exec();
        if (duplicatePF)
          throw new Error("Profile email has Already been exist");
        const profile = await UserProfile.create({
          account: doc._id,
          firstName: doc.username,
          email: doc.email,
        });
        //Create New Store for new Account
        const duplicateStore = await Store.findOne({
          merchant: doc._id,
        }).exec();
        if (duplicateStore) throw new Error("Store has Already been exist");
        const store = await Store.create({
          storename: doc.username,
          merchant: doc._id,
        });
        //save Store_id in Account's store obj
        const user = await Account.findById(doc._id);
        if (user) {
          user.shop = store._id;
          await user.save();
        } else {
          throw new Error("Shop can't Save Store");
        }
        //
        return res
          .status(200)
          .cookie("accessToken", accessToken, {
            httpOnly: true,
          })
          .json({
            isLoggedIn: true,
            success: true,
            message: "Login successfully",
            accessToken,
            account: doc.username,
            response: {
              ...doc._doc,
              role: assignedRole,
            },
            role: role,
            store,
            profile,
          });
      }
    );
  } catch (err) {
    return res.status(err.status || 500).json({
      isLoggedIn: false,
      success: false,
      error: err.message,
    });
  }
});

//5. Login user

const login = asyncHandler(async function (req, res) {
  const { email, password } = req.body;
  try {
    // 1. Validate email, username, password is empty
    if (!email) throw new Error("Fulfill your email");
    if (!password) throw new Error("Please input your password");

    // 2. Validate user is existed
    const user = await Account.findOne({ email: email }).exec();

    const role = await Role.findOne({ _id: user.role._id }).exec();
    if (!user) throw new Error("Maybe you forgot username or password");
    //get Store that match betteen user and merchant Id
    const store = await Store.findOne({ merchant: user.id }).exec();

    // 3. Validate the log user password is capable
    const isCapable = await bcryptjs.compare(password, user.password);
    if (!isCapable) throw new Error("your password is incorrect");
    // 4. Create a new token and send to user for the further authentication
    let token = new Token({
      id: user._id,
      roleId: user.role._id,
    });
    let accessToken = token.createToken();
    let refreshToken = token.createRefreshToken();

    const response = {
      message: "Login successfully",
      email: user.email,
      role: role.roleName,
      store: store._id,
      accessToken,
      refreshToken,
      accountId: user.id,
      account: user.username,
      isLoggedIn: true,
      success: true,
    };

    tokenList[refreshToken] = response;

    return res
      .status(200)
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        path: "",
      })
      .json(response);
  } catch (err) {
    return res.status(401).json({
      isLoggedIn: false,
      success: false,
      error: err.message,
    });
  }
});
// 6. check Token refresh
const checkToken = asyncHandler(async function (req, res) {
  // refresh the damn token
  const { email, refreshToken } = req.body;
  console.log(req.body);
  // if refresh token exists
  if (refreshToken && refreshToken in tokenList) {
    const user = await Account.findOne({ email: email }).exec();
    let token = new Token({
      id: user._id,
    });
    let accessToken = token.createToken();
    const response = {
      email: user.email,
      name: user.username,
      accessToken: accessToken,
    };
    // update the new token in the list
    tokenList[refreshToken].accessToken = accessToken;
    res.status(200).json(response);
  } else {
    res.status(404).send("Invalid request");
  }
});

// 7. User Logout

const logout = asyncHandler(async function (req, res) {
  res
    .clearCookie("accesToken", {
      httpOnly: true,
    })
    .status(200)
    .json({ isLoggedIn: false, success: true, message: "Logout" });
});

module.exports = {
  registerUser,
  getAccounts,
  getRole,
  login,
  checkToken,
  logout,
  addrole,
  getProfileById,
  updateUserProfile,
};
