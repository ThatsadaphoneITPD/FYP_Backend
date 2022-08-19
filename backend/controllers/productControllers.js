const asyncHandler = require("express-async-handler");
const { default: mongoose } = require("mongoose");
const { Product, Attachment, Account, Category } = require("../models");
const { cloudinary } = require("../utils");

const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find()
    .populate({ path: "category", select: "name" })
    .populate({ path: "attachments", select: "filePath online_url" });
  res.json(products);
});

const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate({
    path: "attachments",
    select: "online_url",
  });

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: "Item not found" });
  }

  res.json(product);
});

const CreateProduct = asyncHandler(async (req, res) => {
  const { title, content, price, categories } = req.body;
  const { accountId } = req.user;
  const files = req.files;

  if (!title || !content || !categories || !price) {
    res.status(400);
    throw new Error("Please Fill all the feilds");
  } else {
    createFolderOnCloudinary(req)
      .then((folder) => {
        return uploadFilesToCloudinaryFolder(folder, files);
      })
      .then((files) => createAttachmentFromCloudinary(files))
      .then((attachmentList) => {
        return Promise.all([
          createNewProduct(req, attachmentList),
          attachmentList,
        ]);
      }) // 4. Find posts
      .then((data) => {
        const [product, attachmentList] = data;
        attachmentList.forEach((attachment) => {
          attachment.product = product._id;
        });
        return res.status(200).json({
          response: [product],
          message: "product successfully",
        });
      })
      .catch((e) => {
        return res.status(401).json({
          error: e.message,
        });
      });
  }
});

const UpdateProduct = asyncHandler(async (req, res) => {
  const { title, content, price, categories } = req.body;
  const files = req.files;

  let product = await Product.findById(req.params.id);
  // console.log(req.user);

  try {
    if (product.user.toString() !== req.user.accountId.toString()) {
      res.status(401);
      throw new Error("You can't perform this action");
    }
    if (product) {
      // 2. update product without files
      product.title = title;
      product.content = content;
      product.category = categories;
      product.price = price;
      // product.attachments = attachment;

      // 3.Validate files
      if (!files) {
        // 5. Update product content
        product = await product.save();
      } else {
        // 6. Update Attachment
        product = await updateAttachmentFromProduct(req, product);
      }
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

const getAttachmentsById = asyncHandler(async (req, res) => {
  const attachments = await Attachment.findById(req.params.id);

  if (attachments) {
    res.json(attachments);
  } else {
    res.status(404).json({ message: "attachments not found" });
  }

  res.json(attachments);
});
const DeleteAttachmetsById = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);

  if (attachment) {
    cloudinary.uploader.destroy(
      attachment.fileName,
      { resource_type: attachment.fileType.split("/")[0] },
      function (error, result) {
        if (error) throw new Error(error);
        // resolve(result);
        res.status(200).json({ message: "Attachment Removed" });
      }
    );
    await attachment.remove();
  } else {
    res.status(404);
    throw new Error("Attachment not Found");
  }
});

const DeleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  try {
    if (product.user.toString() !== req.user.accountId.toString()) {
      res.status(401);
      throw new Error("You can't perform this action");
    }

    if (product) {
      // 1.Remove file from cloudianry and clear attachment from mongo
      product.attachments.forEach((attachment) => {
        removeAllAttachmentOnMongoAndFileOnCloud(attachment, res);
      });
      // 2. Remove Product from Mongo
      await product.remove();
      res.status(200).json({ message: "product Removed" });
    } else {
      res.status(404).json({ message: "product not Found" });
    }
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
});

function createFolderOnCloudinary(req) {
  const { role, email } = req.user;

  return new Promise((resolve, reject) => {
    cloudinary.api.create_folder(
      `EZmarket/[${role.toUpperCase()}]-${email}`,
      {},
      (error, result) => {
        if (error) reject(error);
        resolve(result);
      }
    );
  });
}
function uploadFilesToCloudinaryFolder(folder, files) {
  const { path, name } = folder;
  return Promise.all(
    files.map((file) => {
      return new Promise((resolve, reject) => {
        let fileExtension = /[^.]+$/.exec(file.originalname);
        cloudinary.uploader.upload(
          file.path,
          {
            folder: path,
            filename_override: `${new Date(Date.now()).toLocaleString("en-uk", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}}`,
            use_filename: true,
            unique_filename: true,
            resource_type: "auto",
            format: fileExtension[0],
          },
          function (error, result) {
            if (error) {
              return reject(error);
            }
            resolve(result);
          }
        );
      });
    })
  );
}
function createAttachmentFromCloudinary(files, productId) {
  files = files.map((file) => {
    const {
      public_id,
      signature,
      format,
      resource_type,
      created_at,
      bytes,
      url,
      secure_url,
      api_key,
    } = file;

    return {
      fileName: public_id,
      filePath: secure_url || url,
      fileType: `${resource_type}/${format || "document"}`,
      fileFormat: format,
      fileSize: bytes,
      product: productId,
      createdAt: created_at,
      online_url: secure_url || url,
      api_key: api_key,
      signature,
      downloadable: true,
    };
  });

  return new Promise((resolve, reject) => {
    Attachment.insertMany(files, function (error, docs) {
      if (error) reject(error);
      resolve(docs);
    });
  });
}
function createNewProduct(req, files) {
  const { title, content, price, categories } = req.body;
  const { accountId } = req.user;

  // const categoryAll = await Category.findById(categories).populate({ path: "category", select: "name" });

  return Product.create({
    title,
    content,
    user: accountId,
    price: price,
    category: categories,
    attachments: files.map((file) => file._id),
    createdAt: Date.now(),
  }).then((product) =>
    Product.findById(product._id)
      .populate({
        path: "category",
        select: "name",
      })
      .populate({
        path: "attachments",
        select: "fileName online_url",
      })
      .populate({
        path: "user",
        select: "username email",
      })
  );
}

async function updateAttachmentFromProduct(req, product) {
  try {
    // 1.Remove file from cloudianry and remove attachment from mongo
    removeFileOnCloudinary(product._id);

    product.attachments.forEach((attachment) => {
      removeSingleAttachmentOnMongo(attachment);
    });

    // 2. Create a new Attachment from request
    const files = req.files;

    const newAttachmentList = await createFolderOnCloudinary(req)
      .then((folder) => uploadFilesToCloudinaryFolder(folder, files))
      .then((files) => createAttachmentFromCloudinary(files, product._id));

    product.attachments = newAttachmentList.map((a) => a._id);

    return product;
  } catch (error) {
    throw error;
  }
}

async function removeFileOnCloudinary(productId) {
  const { attachments } = await Product.findById(productId).exec();
  return new Promise((resolve) => {
    Attachment.where({ _id: { $in: attachments } })
      .then((result) => {
        return Promise.all(
          result.map((attach) => {
            return new Promise((resolve) => {
              cloudinary.uploader.destroy(
                attach.fileName,
                { resource_type: attach.fileType.split("/")[0] },
                function (error, result) {
                  if (error) throw new Error(error);
                  resolve(result);
                }
              );
              removeSingleAttachmentOnMongo(attach._id);
            });
          })
        );
      })
      .then((data) => {
        resolve(data);
      })
      .catch((error) =>
        res.status(500).send("Cannot clear attachment from Cloudinary")
      );
  });
}
function removeSingleAttachmentOnMongo(attachmentId) {
  return new Promise((onFulfill) =>
    Attachment.findByIdAndRemove(
      { _id: attachmentId },
      null,
      (err, doc, res) => {
        if (err) return res.status(500).send("Cannot delete attachment now!");
        onFulfill(doc);
      }
    )
  );
}
async function removeAllAttachmentOnMongoAndFileOnCloud(attachmentId, res) {
  const attachment = await Attachment.findById(attachmentId);

  if (attachment) {
    // 1. Remove file on Cloud
    cloudinary.uploader.destroy(
      attachment.fileName,
      { resource_type: attachment.fileType.split("/")[0] },
      function (error, result) {
        if (error) throw new Error(error);
        // resolve(result);
        res.status(200).json({ message: "Attachment Removed" });
      }
    );
    //2. Remove Attachment
    await attachment.remove();
  } else {
    res.status(404);
    throw new Error("Attachment not Found");
  }
}

module.exports = {
  getProducts,
  getProductById,
  getAttachmentsById,
  CreateProduct,
  UpdateProduct,
  DeleteProduct,
  DeleteAttachmetsById,
};