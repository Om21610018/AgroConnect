const Product = require("../models/productSchema");
const Review = require("../models/reviewSchema");
const { uploadImageToCloudinary } = require("../services/cloudinaryServices");

// Add Product
const addProduct = async (req, res) => {
  try {
    req.body.sellerId = req.sellerId;

    // ✅ Fix: Flatten `req.files` into a single array
    const uploadedFiles = Object.values(req.files || {}).flat();

    if (!uploadedFiles.length) {
      return res.status(400).json({ message: "No media uploaded" });
    }

    let mediaArray = [];
    for (let file of uploadedFiles) {
      try {
        let cloudRes = await uploadImageToCloudinary(file.buffer);
        mediaArray.push({
          fileName: file.originalname,
          fileType: file.mimetype.startsWith("image") ? "image" : "video",
          filePath: cloudRes.secure_url,
        });
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        return res.status(500).send({ message: "Error uploading media to Cloudinary" });
      }
    }

    req.body.media = mediaArray;
    req.body.image = mediaArray.length > 0 ? mediaArray[0].filePath : "";

    let product = new Product(req.body);
    await product.save();

    res.status(200).send({ message: "Product Added Successfully" });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).send({ message: "Something went wrong!" });
  }
};


// Update Product
const updateProduct = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    const uploadedFiles = req.files;

    let product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== sellerId) {
      return res.status(403).send({ message: "You are not authorized to update this product" });
    }

    let updatedFields = { ...req.body };

    if (uploadedFiles && uploadedFiles.length > 0) {
      let mediaArray = [];
      for (let file of uploadedFiles) {
        try {
          let cloudRes = await uploadImageToCloudinary(file.buffer);
          mediaArray.push({
            fileName: file.originalname,
            fileType: file.mimetype.startsWith("image") ? "image" : "video",
            filePath: cloudRes.secure_url,
          });
        } catch (error) {
          console.error(error);
          return res.status(500).send({ message: "Error uploading media to Cloudinary" });
        }
      }
      updatedFields.media = mediaArray;
      updatedFields.image = mediaArray.length > 0 ? mediaArray[0].filePath : product.image;
    }

    await Product.findByIdAndUpdate(req.params.productId, updatedFields);
    res.status(200).send({ message: "Product Updated Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: "Something went wrong!" });
  }
};

// Get Product Data By Id
const getProductDataById = async (req, res) => {
  try {
    let product = await Product.findById(req.params.productId).lean();
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }
    // console.log(product);
    res.status(200).send(product);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something went wrong!" });
  }
};

const getProductDataByCategory = async (req, res) => {
  try {
    let { page = 1, products_per_page = 10 } = req.query;
    let skip = (page - 1) * products_per_page;

    const totalProduct = await Product.countDocuments({ category: req.params.category });
    const hasMore = totalProduct > page * products_per_page;

    let data = await Product.find({ category: req.params.category })
      .sort({ date: -1 })
      .skip(skip)
      .limit(Number(products_per_page))
      .select("name image media brand measuringUnit pricePerUnit minimumOrderQuantity location sellerId")
      .lean();

    res.status(200).send({ products: data, hasMore });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send({ message: "Something went wrong!" });
  }
};


// Delete Product
const deleteProduct = async (req, res) => {
  try {
    const sellerId = req.sellerId;
    let product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    if (product.sellerId.toString() !== sellerId) {
      return res.status(403).send({ message: "You are not authorized to delete this product" });
    }

    await Product.findByIdAndDelete(req.params.productId);
    res.status(200).send({ message: "Product deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something went wrong!" });
  }
};

// <<<<<<< main
// Get Product Dashboard Data
const getProductDashboardData = async (req, res) => {
// =======

// // Search product
// const searchProducts = async (req, res) => {
//   try {
//     const { query } = req.query;
//     const products = await Product.find({
//       $text: { $search: query }
//     }).lean();

//     res.status(200).send(products);
//   } catch (error) {
//     res.status(500).send({ message: "Something went wrong!" });
//     console.log(error);
//   }
// };

// // Get Seller Dashboard Data
// const getProductDataBySellerId = async (req, res) => {
// >>>>>>> main
  try {
    let data = await Product.findById(req.params.productId)
      .select("shelfLife quantity description")
      .lean();
    res.status(200).send(data);
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: "Something went wrong!" });
  }
};

// Get Product Stocks By Id
const getProductStocksById = async (req, res) => {
  try {
    let productQty = await Product.findById(req.params.productId)
      .select("quantity")
      .lean();

    if (!productQty) {
      return res.status(404).send({ message: "Product not found" });
    }

    res.status(200).send({ quantityLeft: productQty.quantity });
  } catch (error) {
    res.status(500).send("Something went wrong!");
    console.log(error);
  }
};

// Get Seller Dashboard Data
const getProductDataBySellerId = async (req, res) => {
  try {
    let data = await Product.find({ sellerId: req.sellerId }).lean();
    // console.log(data);
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send({ message: "Something went wrong!" });
  }
};

const getMainProductDataById = async (req, res) => {
  try {
    let product = await Product.findById(req.params.productId)
      .select(
        "name image brand measuringUnit pricePerUnit minimumOrderQuantity location sellerId"
      )
      .lean();

    if (!product) {
      return res.status(404).send({ message: "Product not found" });
    }

    // console.log(data);
    res.status(200).send(product);
  } catch (error) {
    res.status(500).send("Something went wrong!");
    console.log(error);
  }
};

module.exports = {
  addProduct,
  getProductDataByCategory,
  getProductDataById,
  getProductDataBySellerId,
  deleteProduct,
  updateProduct,
  getProductStocksById,
  getProductDashboardData,
  getMainProductDataById,
  searchProducts
};
