import React, { useState, useEffect } from "react";
import axios from "axios";

const Commodities = () => {
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  const [filters, setFilters] = useState({
    state: "Maharashtra",
    district: "Sangli",
    market: "",
    commodity: "",
    variety: "",
    grade: "",
  });

  const fetchData = async (
    searchFilters,
    currentPage,
    currentSortField,
    currentSortOrder
  ) => {
    try {
      setLoading(true);
      setError("");

      let apiUrl =
        "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=579b464db66ec23bdd0000016d515aae4a63475c7c2777686d73d8bc&format=json";

      // Add pagination
      apiUrl += `&offset=${(currentPage - 1) * 10}&limit=10`;

      // Add filters
      Object.entries(searchFilters).forEach(([key, value]) => {
        if (key === "state") {
          apiUrl += `&filters%5BState.keyword%5D=${encodeURIComponent(value)}`;
        } else if (key === "district" && value !== "") {
          apiUrl += `&filters%5BDistrict.keyword%5D=${encodeURIComponent(value)}`;
        }else if (key === "commodity" && value !== ""){
          apiUrl += `&filters%5BCommodity.keyword%5D=${encodeURIComponent(value)}`;
        }
      });

      // Add sorting
      if (currentSortField) {
        apiUrl += `&sort%5B${currentSortField}%5D=${currentSortOrder}`;
      }
      console.log("This is api", apiUrl);
      const response = await axios.get(apiUrl);

      console.log("API Response:", response.data);
      setCommodities(response.data.records);
    } catch (error) {
      setError("Error fetching data");
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on component mount and when page, sortField, or sortOrder changes
  useEffect(() => {
    fetchData(filters, page, sortField, sortOrder);
  }, [page, sortField, sortOrder]);

  // Handle input changes in the search form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    fetchData(filters, 1, sortField, sortOrder);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Commodities Data</h1>

      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* State */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="state"
            >
              State
            </label>
            <input
              type="text"
              name="state"
              value={filters.state}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* District */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="district"
            >
              District
            </label>
            <input
              type="text"
              name="district"
              value={filters.district}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Market */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="market"
            >
              Market
            </label>
            <input
              type="text"
              name="market"
              value={filters.market}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Commodity */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="commodity"
            >
              Commodity
            </label>
            <input
              type="text"
              name="commodity"
              value={filters.commodity}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Variety */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="variety"
            >
              Variety
            </label>
            <input
              type="text"
              name="variety"
              value={filters.variety}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>

          {/* Grade */}
          <div>
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="grade"
            >
              Grade
            </label>
            <input
              type="text"
              name="grade"
              value={filters.grade}
              onChange={handleInputChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="mt-4">
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Search
          </button>
        </div>
      </form>

      {/* Display the results in a table */}
      {loading ? (
        <p className="text-center text-blue-500">Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : (
        <>
          <table className="min-w-full bg-white shadow-md rounded overflow-hidden mt-6">
            <thead>
              <tr>
                {[
                  "state",
                  "district",
                  "market",
                  "commodity",
                  "variety",
                  "grade",
                  "min_price",
                  "max_price",
                  "modal_price",
                  "arrival_date",
                ].map((field) => (
                  <th
                    key={field}
                    className="py-2 px-4 bg-gray-200 text-left cursor-pointer"
                    onClick={() => handleSort(field)}
                  >
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                    {sortField === field && (sortOrder === "asc" ? " ▲" : " ▼")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {commodities.map((commodity, index) => (
                <tr
                  key={index}
                  className="border-t hover:bg-slate-100 cursor-pointer"
                >
                  <td className="py-2 px-4">{commodity.State}</td>
                  <td className="py-2 px-4">{commodity.District}</td>
                  <td className="py-2 px-4">{commodity.Market}</td>
                  <td className="py-2 px-4">{commodity.Commodity}</td>
                  <td className="py-2 px-4">{commodity.Variety}</td>
                  <td className="py-2 px-4">{commodity.Grade}</td>
                  <td className="py-2 px-4">{commodity.Min_Price}</td>
                  <td className="py-2 px-4">{commodity.Max_Price}</td>
                  <td className="py-2 px-4">{commodity.Modal_Price}</td>
                  <td className="py-2 px-4">{commodity.Arrival_Date}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="py-2 px-4">Page {page}</span>
            <button
              onClick={() => handlePageChange(page + 1)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Commodities;
