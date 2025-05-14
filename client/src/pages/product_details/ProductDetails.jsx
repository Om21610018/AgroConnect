import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { PiSmileySadLight } from "react-icons/pi";
import { IoBagRemoveOutline } from "react-icons/io5";
import { FaHandshake, FaComment } from "react-icons/fa";
import { addToCart, removeFromCart } from "../../redux/actions";
import Heading from "../../components/heading/Heading";
import useProducts from "../../hooks/products/useProducts";
import useStockUpdateSocket from "../../hooks/socket/useStockUpdateSocket";
import TextSkeleton from "../../components/skeleton/TextSkeleton";
import { CiNoWaitingSign } from "react-icons/ci";
import { useParams } from "react-router-dom";
import BoxSkeleton from "../../components/skeleton/BoxSkeleton";
import ShareButton from "../../components/button/ShareButton";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import Slider from "react-slick";
import { useCookies } from "react-cookie";
import axios from "axios";
import ChatModal from "../../components/chat/ChatModal";

function ProductDetails() {
  const dispatch = useDispatch();
  const { productId } = useParams();
  const [cookies] = useCookies(["userId", "email"]);
  const productData = useSelector((state) => state.productReducer);
  const cartData = useSelector((state) => state.cartReducer);

  const { getProductUserDashboardData, getMainProductData, isLoading } =
    useProducts();

  const [isMainDataLoading, setIsMainDataLoading] = useState(false);
  const [productDashboardData, setProductDashboardData] = useState(productData);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [negotiatedPrice, setNegotiatedPrice] = useState("");
  const [negotiateError, setNegotiateError] = useState("");
  const [negotiationSubmitted, setNegotiationSubmitted] = useState(false);

  // New state for user's latest negotiation
  const [latestNegotiation, setLatestNegotiation] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false); // State to control chat modal visibility

  useStockUpdateSocket(setProductDashboardData);

  useEffect(() => {
    setProductDashboardData(productData);
  }, [productData]);

  // Fetch latest negotiation for this user and product
  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        if (!cookies.email) return;
        const res = await axios.get(
          `http://localhost:8000/negotiation?email=${cookies.email}`
        );

        console.log("Negotiations Response:", res.data);
        if (Array.isArray(res.data.negotiations)) {
          // Find the most recent negotiation matching all fields
          const filtered = res.data.negotiations.filter(
            (n) =>
              n.userId?._id === cookies.userId &&
              n.productId?._id === productId
          );

          console.log("Filtered Negotiations:", filtered);
          // Sort by createdAt descending and pick the latest
          if (filtered.length > 0) {
            const sorted = filtered.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setLatestNegotiation(sorted[0]);
          } else {
            setLatestNegotiation(null);
          }
        } else {
          setLatestNegotiation(null);
        }
      } catch (err) {
        setLatestNegotiation(null);
      }
    };
    fetchNegotiations();
    // eslint-disable-next-line
  }, [cookies.userId, cookies.email, productId, productDashboardData?.sellerId, negotiationSubmitted]);

  // Helper: get the price to show in cart based on negotiation status
  const getCartPrice = () => {
    if (
      latestNegotiation &&
      latestNegotiation.status === "accepted" &&
      latestNegotiation.negotiatedPrice
    ) {
      return latestNegotiation.negotiatedPrice;
    }
    return productDashboardData?.pricePerUnit;
  };

  // Update cart price if negotiation is accepted and product is in cart
  useEffect(() => {
    if (
      latestNegotiation &&
      latestNegotiation.status === "accepted" &&
      cartData.some((item) => item._id === productDashboardData?._id)
    ) {
      // Update cart with negotiated price
      // dispatch(
      //   addToCart({
      //     ...cartData.find((item) => item._id === productDashboardData?._id),
      //     pricePerUnit: latestNegotiation.negotiatedPrice,
      //     currentPrice:
      //       latestNegotiation.negotiatedPrice *
      //       productDashboardData.minimumOrderQuantity,
      //   })
      // );
    }
  }, [latestNegotiation, cartData, productDashboardData, dispatch]);

  const isProductInCart = cartData.some(
    (item) => item._id === productDashboardData?._id
  );

  const fetchProductDashboardData = async () => {
    let data = await getProductUserDashboardData(productData?._id || productId);
    setProductDashboardData((prevData) => {
      return {
        ...prevData,
        ...data,
      };
    });
  };

  const fetchAllData = async () => {
    if (!productData) {
      setIsMainDataLoading(true);
      await getMainProductData(productId);
      setIsMainDataLoading(false);
    }
    await fetchProductDashboardData();
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const addProductToCart = () => {
    let cartProductData = {
      _id: productDashboardData._id,
      sellerId: productDashboardData.sellerId,
      image: productDashboardData.image,
      name: productDashboardData.name,
      category: productDashboardData.category,
      qty: productDashboardData.minimumOrderQuantity,
      brand: productDashboardData.brand,
      minQty: productDashboardData.minimumOrderQuantity,
      stocksLeft: productDashboardData.quantity,
      pricePerUnit: getCartPrice(),
      unit: productDashboardData.measuringUnit,
      currentPrice:
        getCartPrice() * productDashboardData.minimumOrderQuantity,
    };
    dispatch(addToCart(cartProductData));
  };

  const removeProductFromCart = () => {
    dispatch(removeFromCart(productDashboardData?._id));
  };

  const openNegotiateModal = () => {
    setShowNegotiateModal(true);
    setNegotiatedPrice("");
    setNegotiateError("");
    setNegotiationSubmitted(false);
  };

  const closeNegotiateModal = () => {
    setShowNegotiateModal(false);
  };

  const handleNegotiateSubmit = async (e) => {
    e.preventDefault();

    const priceValue = parseFloat(negotiatedPrice);

    if (!negotiatedPrice || isNaN(priceValue)) {
      setNegotiateError("Please enter a valid price");
      return;
    }

    if (priceValue <= 0) {
      setNegotiateError("Price must be greater than zero");
      return;
    }

    try {
      const userId = cookies.userId;
      const email = cookies.email;

      if (!userId || !email) {
        setNegotiateError("User not authenticated. Please log in.");
        return;
      }

      const sellerId = productDashboardData?.sellerId;
      const productId = productDashboardData?._id;
      const actualPrice = productDashboardData?.pricePerUnit;

      const negotiationData = {
        email: email,
        userId: userId,
        sellerId: sellerId,
        productId: productId,
        actualPrice: actualPrice,
        negotiatedPrice: priceValue,
      };

      if (
        !negotiationData.email ||
        !negotiationData.userId ||
        !negotiationData.sellerId ||
        !negotiationData.productId
      ) {
        setNegotiateError("Missing required information. Please try again.");
        return;
      }

      const response = await axios.post(
        "http://localhost:8000/negotiation/",
        negotiationData
      );

      setNegotiationSubmitted(true);
      setNegotiateError("");
    } catch (error) {
      setNegotiateError(
        error.response?.data?.message || "Failed to submit negotiation."
      );
    }
  };

  const handleOpenChat = () => {
    setShowChatModal(true);
  };

  const handleCloseChat = () => {
    setShowChatModal(false);
  };

  // Negotiation status UI
  const renderNegotiationStatus = () => {
    if (!latestNegotiation) return null;
    if (latestNegotiation.status === "pending") {
      return (
        <div className="my-4 p-3 rounded bg-yellow-50 border border-yellow-300 text-yellow-800">
          <b>Status:</b> Your negotiation is <b>pending</b>.
        </div>
      );
    }
    if (latestNegotiation.status === "accepted") {
      return (
        <div className="my-4 p-3 rounded bg-green-50 border border-green-300 text-green-800">
          <b>Status:</b> <span className="text-green-700">Accepted</span>
          <br />
          <b>Negotiated Price:</b> Rs. {latestNegotiation.negotiatedPrice}/
          {productDashboardData?.measuringUnit}
          <br />
          <span className="text-xs text-green-700">
            This price will be used in your cart.
          </span>
        </div>
      );
    }
    if (latestNegotiation.status === "rejected") {
      return (
        <div className="my-4 p-3 rounded bg-red-50 border border-red-300 text-red-800">
          <b>Status:</b> <span className="text-red-700">Rejected</span>
          <br />
          <b>Price:</b> Rs. {productDashboardData?.pricePerUnit}/
          {productDashboardData?.measuringUnit}
          <br />
          <span className="text-xs text-red-700">
            Actual price will be used in your cart.
          </span>
        </div>
      );
    }
    return null;
  };

  // const mediaItems = productDashboardData?.media || [
  //   { type: "image", url: "https://plus.unsplash.com/premium_photo-1667030474693-6d0632f97029?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  //   { type: "image", url: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1430&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  //   { type: "video", url: "https://www.youtube.com/watch?v=Pj0HbO0LI7E" }, // Sample video
  // ];

  const mediaItems = productDashboardData.media.map(item => ({
    type: item.fileType,  // "image" or "video"
    url: item.filePath,   // Cloudinary URL or any other source
  }));
  console.log(productDashboardData.media);

  const sliderSettings = {
    dots: true,
    infinite: mediaItems.length > 1, // Disable infinite loop if only 1 image
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: mediaItems.length > 1, // Disable autoplay if only 1 image
    autoplaySpeed: 3000,
    arrows: true,
    adaptiveHeight: false,
  };


  return (
    <>
      <div className="lg:w-11/12 mx-auto flex flex-wrap">

        {isMainDataLoading ? (
          <BoxSkeleton height="h-64" width="lg:w-1/2 w-full" />
        ) : (
          <div className="lg:w-1/2 w-full h-[300px] md:h-[350px] rounded relative mx-auto">
            <Slider {...sliderSettings} className="h-full w-full">
              {mediaItems.map((item, index) => (
                <div key={index} className="h-[300px] md:h-[350px] w-full flex justify-center items-center bg-gray-200">
                  {item.type === "image" ? (
                    <img
                      loading="lazy"
                      className="w-full h-full object-cover"
                      src={item.url}
                      alt={productDashboardData?.name || "Product Image"}
                    />
                  ) : (
                    <video className="w-full h-full object-cover" controls>
                      <source src={item.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              ))}
            </Slider>
            <span className="absolute top-0 right-0 m-2">
              <ShareButton url={window.location.href} />
            </span>
          </div>
        )}

        <div className="lg:w-1/2 w-full px-4 space-y-1 lg:pl-10 lg:py-6 mt-6 lg:mt-0">
          <h2 className="text-xs md:text-sm title-font text-gray-500 tracking-widest">
            {isMainDataLoading ? (
              <TextSkeleton noOfRows={1} width="w-[80px]" />
            ) : (
              productDashboardData?.brand
            )}
          </h2>
          {isMainDataLoading ? (
            <TextSkeleton noOfRows={1} width="w-[100px]" />
          ) : (
            <Heading
              text={productDashboardData?.name}
              marginY="mb-2"
              textAlign="left"
              paddingX="p-0"
            />
          )}

          <div className="leading-relaxed text-sm md:text-base">
            {isLoading ? (
              <TextSkeleton noOfRows={12} />
            ) : (
              productDashboardData?.description
            )}
          </div>

          <div className="relative overflow-x-auto my-6">
            <table className="w-full text-base text-left text-gray-500">
              <tbody>
                <tr className="bg-white border-b">
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-900 whitespace-nowrap">
                    Stocks Left
                  </th>
                  <td className="px-2 md:px-6 py-2 md:py-4 ">
                    {isLoading ? (
                      <TextSkeleton noOfRows={1} />
                    ) : (
                      `${productDashboardData?.quantity} ${productDashboardData?.measuringUnit}`
                    )}
                  </td>
                </tr>
                <tr className="bg-white border-b">
                  <th className="px-2 md:px-6 py-2 md:py-4 font-medium text-gray-900 whitespace-nowrap">
                    Shelf Life
                  </th>
                  <td className="px-2 md:px-6 py-2 md:py-4 ">
                    {isLoading ? (
                      <TextSkeleton noOfRows={1} />
                    ) : (
                      productDashboardData?.shelfLife
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Negotiation status */}
          {renderNegotiationStatus()}

          <div className="flex justify-between flex-col md:flex-row">
            <div className="space-y-1">
              {isMainDataLoading ? (
                <TextSkeleton noOfRows={1} />
              ) : (
                <div className="text-green-600 font-medium text-sm md:text-base">
                  Minimum Order Quantity:{" "}
                  {productDashboardData?.minimumOrderQuantity}{" "}
                  {productDashboardData?.measuringUnit}
                </div>
              )}
              {isMainDataLoading ? (
                <TextSkeleton
                  noOfRows={1}
                  fontSizeHeight="h-[24px]"
                  fontSizeHeightMd="h-[36px]"
                />
              ) : (
                <div className="flex justify-between">
                  <h2 className="text-2xl md:text-4xl text-left mb-1 font-medium">
                    Rs. {getCartPrice()}/
                    {productDashboardData?.measuringUnit}
                  </h2>
                </div>
              )}
            </div>
          </div>

          {/* Buttons container */}
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            {/* Cart Button */}
            <button
              className={`flex mb-2 md:mb-0 text-white ${isProductInCart
                ? "bg-amber-500 hover:bg-amber-600"
                : "bg-[#e11d48] hover:bg-[#e5345a]"
                } border-0 py-3 px-6 focus:outline-none rounded flex-1`}
              onClick={(e) => {
                e.preventDefault();
                if (isProductInCart) {
                  removeProductFromCart();
                } else {
                  addProductToCart();
                }
              }}
            >
              {isProductInCart ? (
                <span className="flex items-center text-lg h-full w-full justify-center">
                  <IoBagRemoveOutline className="mr-2 text-2xl" />
                  Remove From Cart
                </span>
              ) : (
                <span className="flex items-center text-lg h-full w-full justify-center">
                  <i className="fa-solid fa-bag-shopping text-xl mr-2"></i>
                  Add To Cart
                </span>
              )}
            </button>

            {/* Negotiate Price Button */}
            {!isLoading &&
              !isMainDataLoading &&
              productDashboardData?.quantity > 0 && (
                <button
                  className="flex mb-2 md:mb-0 items-center justify-center text-white bg-yellow-500 hover:bg-yellow-600 border-0 py-3 px-6 rounded flex-1 text-lg transition-colors"
                  onClick={openNegotiateModal}
                >
                  <span className="flex items-center text-lg h-full w-full justify-center">
                    <FaHandshake className="mr-2 text-2xl" />
                    Negotiate Price
                  </span>
                </button>
              )}

            {/* Chat Button */}
            <button
              onClick={handleOpenChat}
              className="flex mb-2 md:mb-0 items-center justify-center text-white bg-blue-600 hover:bg-blue-700 border-0 py-3 px-6 rounded flex-1 text-lg transition-colors"
            >
              <FaComment className="text-xl mr-2" />
              Chat with Seller
            </button>
          </div>


          {showChatModal && (
            <ChatModal
              isOpen={showChatModal}
              onClose={handleCloseChat}
              sellerId={productDashboardData.sellerId}
              productId={productId}
            />
          )}
        </div>
      </div>

      {/* Negotiate Price Modal */}
      {showNegotiateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">
                Negotiate Price
              </h3>
              <button
                onClick={closeNegotiateModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {negotiationSubmitted ? (
              <div className="text-center py-4">
                <div className="text-green-600 text-5xl mb-4">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium text-gray-900">
                  Your price negotiation has been submitted!
                </p>
                <p className="text-gray-600 mt-2">
                  We'll notify you once the seller responds.
                </p>
              </div>
            ) : (
              <form onSubmit={handleNegotiateSubmit}>
                <div className="mb-6">
                  <p className="mb-3 text-gray-600">
                    Current price:{" "}
                    <span className="font-bold">
                      Rs. {productDashboardData?.pricePerUnit}/
                      {productDashboardData?.measuringUnit}
                    </span>
                  </p>
                  <label
                    htmlFor="negotiatePrice"
                    className="block mb-2 text-sm font-medium text-gray-900"
                  >
                    Your offer (Rs./{productDashboardData?.measuringUnit})
                  </label>
                  <input
                    type="number"
                    id="negotiatePrice"
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="Enter your price"
                    required
                    step="0.01"
                    value={negotiatedPrice}
                    onChange={(e) => setNegotiatedPrice(e.target.value)}
                  />
                  {negotiateError && (
                    <p className="mt-2 text-sm text-red-600">
                      {negotiateError}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={closeNegotiateModal}
                    className="text-gray-500 bg-gray-100 hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5"
                  >
                    Submit Offer
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ProductDetails;