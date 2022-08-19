const multer = require("multer");

// const fs = require("fs");
// const path = require("path");

const storage = multer.diskStorage({
  // File will be saved in Local
  // destination: function (req, res, cb) {
  //   const { accountId, account, role } = req.user;
  //   // { view } = req.query;
  //   const { username } = req.body;
  //   let path = `./public/files/${role}/${account + "-" + accountId}`;
  //   fs.mkdirSync(path, { recursive: true });
  //   cb(null, path);
  // },
  filename: function (req, file, cb) {
    const { account, role } = req.user;
    cb(
      null,
      `[${role.toUpperCase()}]` +
        account +
        "-" +
        +Date.now() +
        "-" +
        file.originalname
    );
  },
});
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});

module.exports = upload;
