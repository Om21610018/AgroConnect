import React, { useEffect, useState } from "react";
import axios from "axios";

const PaymentComponent = ({totalAmount}) => {
    const [razorpayLoaded, setRazorpayLoaded] = useState(false);

    // Load Razorpay script dynamically
    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        script.onload = () => setRazorpayLoaded(true);
        document.body.appendChild(script);
    }, []);

    const handlePayment = async () => {
        if (!razorpayLoaded) {
            alert("Payment gateway is loading, please wait...");
            return;
        }

        try {
            // Create order on the backend
            const { data } = await axios.post("http://localhost:8000/payment/create-order", {
                amount: totalAmount, // Convert INR to paise
            });

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID, // Use VITE_ prefix in Vite projects
                amount: data.amount,
                currency: data.currency,
                name: "Agro Connect",
                description: "Test Transaction",
                order_id: data.id,
                handler: async (response) => {
                    const verifyRes = await axios.post("http://localhost:8000/payment/verify-payment", response);
                    if (verifyRes.data.success) {
                        alert("Payment Successful");
                    } else {
                        alert("Payment Verification Failed");
                    }
                },
                prefill: {
                    name: "Test User",
                    email: "test@example.com",
                    contact: "9999999999",
                },
                theme: { color: "#3399cc" },
            };

            const razor = new window.Razorpay(options);
            razor.open();
        } catch (error) {
            console.error("Payment initiation failed:", error);
            alert("Payment failed. Try again!");
        }
    };

    return (
        <button
            className="hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 py-5 w-96 md:w-full bg-gray-800 text-base font-medium leading-4 text-white flex flex-row justify-center items-center"
            onClick={handlePayment}
            disabled={!razorpayLoaded} // Disable button until Razorpay is loaded
        >
            {razorpayLoaded ? "Pay Now" : "Loading..."}
        </button>
    );
};

export default PaymentComponent;
