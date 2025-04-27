import React, { useEffect, useState } from "react";
import useOrder from "../../hooks/orders/useOrder";
import axios from "axios";
import { useCookies } from "react-cookie";

// Card component for each order
function OrderCard({ order }) {
  const {
    _id,
    productId,
    orderQty,
    totalAmount,
    date,
    orderLocation,
    status,
    sellerId,
  } = order;

  // Status badge color based on order status
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col md:flex-row gap-4 md:gap-6 p-4 bg-white">
      <div className="flex-shrink-0">
        <img
          src={productId.image}
          alt={productId.name}
          className="w-full md:w-32 h-32 object-cover rounded-md shadow-sm"
        />
      </div>
      
      <div className="flex-1 space-y-2">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
          <h3 className="font-semibold text-lg text-gray-900">{productId.name}</h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
            {status || "N/A"}
          </span>
        </div>
        
        <div className="text-gray-500 text-sm">Order ID: <span className="font-medium text-gray-700">{_id}</span></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium text-gray-700">Category:</span> {productId.category}
          </div>
          <div>
            <span className="font-medium text-gray-700">Quantity:</span> {orderQty} {productId.measuringUnit}
          </div>
          <div>
            <span className="font-medium text-gray-700">Price per Unit:</span> ₹{productId.pricePerUnit}
          </div>
          <div>
            <span className="font-medium text-gray-700">Total Amount:</span> <span className="font-semibold text-gray-900">₹{totalAmount}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Order Date:</span>{" "}
            {date ? new Date(date).toLocaleString() : "N/A"}
          </div>
          <div className="truncate">
            <span className="font-medium text-gray-700">Location:</span>{" "}
            {orderLocation ? `${orderLocation.latitude.toFixed(4)}, ${orderLocation.longitude.toFixed(4)}` : "N/A"}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 pt-1 border-t border-gray-100">
          Seller ID: {sellerId}
        </div>
      </div>
    </div>
  );
}

// List component for all orders
function OrderProducts({ orders }) {
  return (
    <div className="space-y-6">
      {orders.map((order) => (
        <OrderCard key={order._id} order={order} />
      ))}
    </div>
  );
}

function CustomerOrder() {
  const [orders, setOrders] = useState([]);
  const { getUserOrders, isLoading } = useOrder();
  const [error, setError] = useState(null);
    const [cookies, setCookie] = useCookies([
      "email"
    ]);

  // Hardcoded userId for now
  const userId = "66f7fa5b14a9352c2b08aa3e";

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/order/user?email=${cookies.email}`);
        console.log("Fetched Orders:", response);
        setOrders(response.data);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders. Please try again later.");
        setOrders([]);
      }
    };
    fetchOrders();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="mb-6 border-b border-gray-200 pb-4">
        <h2 className="text-2xl font-bold text-gray-800">My Orders</h2>
        <p className="text-gray-500 mt-1">Track and manage your purchases</p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {orders.length === 0 && !error ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-2">No orders found.</p>
          <p className="text-sm text-gray-500">Start shopping to see your orders here.</p>
        </div>
      ) : (
        <OrderProducts orders={orders} />
      )}
    </div>
  );
}

export default CustomerOrder;