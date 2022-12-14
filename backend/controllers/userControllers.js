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
const getOneUser = asyncHandler(async (req, res) => {
  try {
    const user = await Account.findOne({ _id: req.user.accountId })
      .select({
        username: 1,
        email: 1,
        role: 1,
        profileImage: 1,
      })
      .populate({ path: "role", select: "roleName" });
    const profile = await UserProfile.findOne({
      account: req.user.accountId,
    }).select({
      firstName: 1,
      lastName: 1,
      age: 1,
    });
    const RoleSwitch = [roles.SHOPPER, roles.MERCHANT];
    res.status(200).send({ user: user, profile: profile, roles: RoleSwitch });
  } catch (err) {
    res.status(500).send({ message: err.message });
  }
});
const UpdateUserInfo = asyncHandler(async (req, res) => {
  try {
    const user = await Account.findOne({ _id: req.user.accountId })
      .select({
        username: 1,
        email: 1,
        role: 1,
        profileImage: 1,
      })
      .populate({ path: "role", select: "roleName" });
    const profile = await UserProfile.findOne({
      account: req.user.accountId,
    }).select({
      firstName: 1,
      lastName: 1,
      age: 1,
    });
    const username = req.query.username;
    const Roleid = req.query.roleId;
    const first = req.query.first;
    const last = req.query.last;
    const age = req.query.age;
    const url = req.query.url;

    const assignedRole = await Role.findOne({ roleName: Roleid }).exec();
    if (user.length !== 0) {
      let meassage1 = "";
      if (assignedRole) {
        user.role = assignedRole._id;
        await user.save();
        // console.log(updateuser);
        meassage1 = "user Change Role as " + Roleid;
      }
      if (first !== "") {
        profile.firstName = first;
        await profile.save();
        meassage1 = "Change Name";
      }
      if (last !== "") {
        profile.lastName = last;
        await profile.save();
        meassage1 = "Change Content";
      }
      if (age !== "") {
        profile.age = age;
        await profile.save();
        meassage1 = "Change Age";
      }
      if (username !== "") {
        user.username = username;
        await user.save();
        meassage1 = "Change Store Name";
      }
      if (url !== "") {
        user.profileImage = url;
        await user.save();
        meassage1 = "Change Avatar";
      }
      res.status(200).send({
        user: user,
        profile: profile,
        message: meassage1,
      });
    } else {
      res.status(404).json({ message: "orderItem not found" });
    }
  } catch (err) {
    res.status(500).send({ message: err.message });
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
      avatar: user.profileImage,
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
  UpdateUserInfo,
  getOneUser,
  getAccounts,
  getRole,
  login,
  checkToken,
  logout,
  addrole,
};
