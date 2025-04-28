import React from "react";
import useHttpClient from "../api/useHttpClient";
import {
  GET_SELLER_ORDERS,
  ORDER_PRODUCT,
  GET_USER_ORDERS,
} from "../../constants/apiEndpoints";
import { removeFromCart } from "../../redux/actions";
import { useDispatch } from "react-redux";

const useOrder = () => {
  const dispatch = useDispatch();

  const { sendAuthorizedRequest, isLoading } = useHttpClient();

  const orderProduct = async (orderData) => {
    try {
      let res = await sendAuthorizedRequest(
        "user",
        ORDER_PRODUCT,
        "POST",
        orderData
      );

      if (res !== false) {
        for (const item of orderData) {
          dispatch(removeFromCart(item.productId));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getSellerOrders = async () => {
    try {
      const res = await sendAuthorizedRequest(
        "seller",
        GET_SELLER_ORDERS,
        "GET"
      );
      return res.data;
    } catch (error) {
      console.log(error);
    }
  };
  const getUserOrders = async (userId) => {
    try {
      const res = await sendAuthorizedRequest(
        "seller",
        GET_USER_ORDERS(userId),
        "GET"
      );
      return res.data;
    } catch (error) {
      throw error;
    }
  };
  const updateOrderStatus = async (req, res) => {
    try {
      const { orderId } = req.query;
      const { status } = req.body;
  
      // Validate status value
      if (!["pending", "delivered", "cancelled"].includes(status)) {
        return res.status(400).send({ message: "Invalid status value" });
      }
  
      // Update order status
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status },
        { new: true }
      )
        .populate({
          path: "productId",
          select: "image category name measuringUnit pricePerUnit",
        })
        .populate({ path: "userId", select: "name email contact" });
  
      if (!updatedOrder) {
        return res.status(404).send({ message: "Order not found" });
      }
  
      res.status(200).send({ message: "Order status updated", order: updatedOrder });
    } catch (error) {
      res.status(500).send({ message: "Something went wrong!" });
      console.log(error);
    }
  };

  return { orderProduct, getSellerOrders, isLoading, getUserOrders,updateOrderStatus };
};

export default useOrder;
