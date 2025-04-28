const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const verifyAccessToken = require("../middlewares/verifyAccessToken");
const multer = require("multer");

const upload = multer();

// ✅ Fix: Use `upload.fields()` to match form-data structure
const uploadMiddleware = upload.fields([
  { name: "image", maxCount: 1 }, // Single image file
  { name: "media[0][file]", maxCount: 1 },
  { name: "media[1][file]", maxCount: 1 },
  { name: "media[2][file]", maxCount: 1 },
]);

// Add Product
router.post("/", verifyAccessToken, uploadMiddleware, productController.addProduct);


// Search Products
// router.get("/search", productController.searchProducts);

// Get Product Data By Category
router.get("/category/:category", productController.getProductDataByCategory);

// Get Product Dashboard Data By Id
router.get("/dashboard/:productId", productController.getProductDashboardData);

// Get Seller Dashboard Products Data
router.get(
  "/seller",
  verifyAccessToken,
  productController.getProductDataBySellerId
);

// Get Product Data By Id
router.get(
  "/getProductDataById/:productId",
  productController.getProductDataById
);

// Get Product Stocks By Id
router.get(
  "/getProductStocksById/:productId",
  productController.getProductStocksById
);

// Delete Product
router.delete(
  "/:productId",
  verifyAccessToken,
  productController.deleteProduct
);

// Update Product
router.put(
  "/:productId",
  verifyAccessToken,
  upload.single("image"),
  productController.updateProduct
);

// Get main product data by id 
router.get("/mainProductData/:productId", productController.getMainProductDataById);


module.exports = router;
