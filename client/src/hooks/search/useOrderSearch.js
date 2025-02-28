import { useState, useEffect } from "react";

const useOrderSearch = (orders) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredOrders, setFilteredOrders] = useState(orders);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredOrders(orders);
        } else {
            const lowerCaseQuery = searchQuery.toLowerCase();

            const filtered = orders
                .filter((order) => order && order.productId && order.userId) // Avoid undefined
                .filter((order) =>
                    (order.productId.name || "").toLowerCase().includes(lowerCaseQuery) ||
                    (order.productId.category || "").toLowerCase().includes(lowerCaseQuery) ||
                    (order.userId.name || "").toLowerCase().includes(lowerCaseQuery) ||
                    (order.userId.email || "").toLowerCase().includes(lowerCaseQuery) ||
                    String(order.userId.contact || "").toLowerCase().includes(lowerCaseQuery) // Ensure string
                );

            setFilteredOrders(filtered);
        }
    }, [searchQuery, orders]);

    return { searchQuery, setSearchQuery, filteredOrders };
};

export default useOrderSearch;
