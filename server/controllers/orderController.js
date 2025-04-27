const Order = require("../models/orderSchema");
const { decreaseProductStocks } = require("../services/productServices");

// Add Order
const addOrder = async (req, res) => {
  try {
    const orders = req.body;
    const userId = req.userId;
    
    // Check orders variable is an array
    if (!Array.isArray(orders)) {
      return res.status(400).send({ message: "Invalid orders data" });
    }

    for (const order of orders) {
      order.userId = userId;

      let data = Order(order);
      let result = await data.save();
      console.log(result);
      await decreaseProductStocks(data.productId, data.orderQty);
    }

    res.status(200).send({ message: `All orders successfully received` });
  } catch (error) {
    res.status(500).send("Something went wrong!");
    console.log(error);
  }
};

// Retrieve Order by Seller ID
const showOrdersBySeller = async (req, res) => {
  try {
    let data = await Order.find({ sellerId: req.sellerId })
      .populate({
        path: "productId",
        select: "image category name measuringUnit pricePerUnit",
      })
      .populate({ path: "userId", select: "name email contact" })
      .lean();

    console.log("Raw Data:", data);

    // Ensure orderDate is properly formatted and sort in descending order
    data = data
      .map((order) => {
        return {
          ...order,
          orderDate: new Date(order.orderDate), // Convert to Date object
          totalAmount: order.orderQty * order.productId.pricePerUnit,
        };
      })
      .sort((a, b) => b.orderDate - a.orderDate); // Sort by orderDate (latest first)

    console.log("Sorted Data:", data);

    res.status(200).send(data);
  } catch (error) {
    res.status(500).send("Something went wrong!");
    console.log(error);
  }
};


const showOrdersByUser = async (req, res) => {
  try {
    const { userId, email } = req.query;

    let query = {};
    if (userId) {
      query.userId = userId;
    } else if (email) {
      query = { ...query, "userId": await getUserIdByEmail(email) };
      if (!query.userId) {
        return res.status(404).send({ message: "User not found" });
      }
    } else {
      return res.status(400).send({ message: "User ID or email required" });
    }

    let data = await Order.find(query)
      .populate({
        path: "productId",
        select: "image category name measuringUnit pricePerUnit",
      })
      .populate({ path: "userId", select: "name email contact" })
      .lean();

    data = data.map((order) => ({
      ...order,
      orderDate: new Date(order.orderDate),
      totalAmount: order.orderQty * order.productId.pricePerUnit,
    })).sort((a, b) => b.orderDate - a.orderDate);

    res.status(200).send(data);
  } catch (error) {
    res.status(500).send("Something went wrong!");
    console.log(error);
  }
};

// Update Order Status

const updateOrderStatus = async (req, res) => {
  try {
    console.log("Update Order Status Request:", req.body, req.query);
    const { orderId } = req.query;
    const { status } = req.body;

    if (!["pending", "delivered", "cancelled"].includes(status)) {
      return res.status(400).send({ message: "Invalid status value" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).send({ message: "Order not found" });
    }

    res.status(200).send({ message: "Order status updated", order: updatedOrder });
  } catch (error) {
    res.status(500).send("Something went wrong!");
    console.log(error);
  }
};

// Helper function to get userId by email (requires User model)
const User = require("../models/userSchema");
const getUserIdByEmail = async (email) => {
  const user = await User.findOne({ email });
  return user ? user._id : null;
};

module.exports = {
  addOrder,
  showOrdersBySeller,
  showOrdersByUser, // <-- export the new controller
  updateOrderStatus, // <-- export the new controller
};


