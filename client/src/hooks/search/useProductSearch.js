import { useState, useEffect } from "react";

const useProductSearch = (products) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);

  useEffect(() => {
    if (!searchQuery) {
      setFilteredProducts(products);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      console.log(products)
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerCaseQuery) ||
          product.category.toLowerCase().includes(lowerCaseQuery) ||
          product.description.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  return { searchQuery, setSearchQuery, filteredProducts };
};

export default useProductSearch;
