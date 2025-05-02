import React, { useState, useEffect } from "react";
import { GoDotFill } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import TableSkeleton from "../../components/skeleton/TableSkeleton";
import EmptyStateText from "../../components/empty_state/EmptyStateText";
import Heading from "../../components/heading/Heading";
import useOrder from "../../hooks/orders/useOrder";
import useOrderSearch from "../../hooks/search/useOrderSearch";
import axios from "axios";
import { ORDER_PRODUCT, UPDATE_ORDER_STATUS } from "../../constants/apiEndpoints";

function SellerOrderRequests() {
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  const { getSellerOrders, isLoading } = useOrder();

  // API to GET Data
  const getOrders = async () => {
    let orderedData = await getSellerOrders();
    setData(orderedData);
  };

  useEffect(() => {
    getOrders();
  }, []);

  const { searchQuery, setSearchQuery, filteredOrders } = useOrderSearch(data);


  // Update order status
  const handleStatusChange = async (orderId, newStatus) => {
    console.log("Updating order status:", orderId, newStatus);
    try {
      await axios.patch(`http://localhost:8000/order/orderStatusUpdate?orderId=${orderId}`, { status: newStatus });
      setData((prev) =>
        prev.map((item) =>
          item._id === orderId ? { ...item, status: newStatus } : item
        )
      );
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Status color helper
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "text-green-600";
      case "cancelled":
        return "text-red-600";
      case "pending":
      default:
        return "text-yellow-500";
    }
  };

  return (
    <>
      {/* Table Header */}
      <Heading text={"All Orders"} textAlign="text-left" />
      <div className="w-full flex flex-col gap-2 md:flex-row items-center justify-between px-4">
        <div className="mt-1 relative w-full  md:w-96">
          <input
            type="text"
            className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-cyan-600 focus:border-cyan-600 block w-full p-2.5"
            placeholder="Search for products"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col overflow-x-auto w-full">
        <div className="min-w-full py-2">
          {isLoading ? (
            <TableSkeleton />
          ) : data.length === 0 ? (
            <EmptyStateText text="It seems like your order request queue is currently empty. No worries, though! Keep an eye out for incoming orders—they'll pop up right here in your dashboard." />
          ) : (
            <table className="text-center text-sm font-light w-full">
              <thead className="border-b font-medium bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">#</th>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">Image</th>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">Category</th>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">Product Name</th>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">Order Date</th>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">Customer Name</th>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">Customer PhoneNo</th>
                  <th scope="col" className="px-6 whitespace-nowrap py-4">Customer Email</th>
                  <th scope="col" className="px-6 whitespace-nowrap  py-4">Order Quantity</th>
                  <th scope="col" className="px-6 py-4 whitespace-nowrap">Order Location</th>
                  <th scope="col" className="px-6 py-4 whitespace-nowrap">Total Price</th>
                  <th scope="col" className="px-6 py-4 whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {[...filteredOrders]
                  .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sorting in descending order
                  .map((item, index) => (
                    <tr
                      className="border-b transition duration-300 ease-in-out hover:bg-neutral-100 text-center"
                      key={index}
                    >
                      <td className="px-6 py-4 font-medium">{index + 1}</td>
                      <td className="px-6 py-2">
                        <img src={item.productId.image} alt="Image" loading="lazy" />
                      </td>
                      <td className="px-6 py-4">{item.productId.category}</td>
                      <td className="px-6 py-4">{item.productId.name}</td>
                      <td className="px-6 py-4">
                        {new Date(item.date).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false, // Ensures 24-hour format
                        })}
                      </td>
                      <td className=" px-6 py-4 max-w-sm truncate hover:whitespace-normal">
                        {item.userId.name}
                      </td>
                      <td className=" px-6 py-4 max-w-sm truncate hover:whitespace-normal">
                        {item.userId.contact}
                      </td>
                      <td className=" px-6 py-4 max-w-sm truncate hover:whitespace-normal">
                        {item.userId.email}
                      </td>
                      <td className=" px-6 py-4 max-w-sm truncate hover:whitespace-normal">
                        {item.orderQty} {item.productId.measuringUnit}
                      </td>
                      <td
                        className=" px-6 py-4 max-w-sm cursor-pointer font-medium text-sky-700 hover:underline whitespace-nowrap"
                        onClick={() => {
                          navigate(
                            `/map/${item.orderLocation.latitude}/${item.orderLocation.longitude}`
                          );
                        }}
                      >
                        {item.orderLocation.latitude.toFixed(4)},{" "}
                        {item.orderLocation.longitude.toFixed(4)}
                      </td>
                      <td className=" px-6 py-4 max-w-sm truncate hover:whitespace-normal">
                        Rs.{item.totalAmount}
                      </td>
                      <td className="px-6 py-4 max-w-sm truncate hover:whitespace-normal">
                        <span className={`flex justify-center items-center ${getStatusColor(item.status)}`}>
                          <GoDotFill className="mr-1" />
                          <select
                            value={item.status}
                            onChange={e => handleStatusChange(item._id, e.target.value)}
                            className="ml-1 border rounded px-1 py-0.5 text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default SellerOrderRequests;