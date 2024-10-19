import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Commodities = () => {
  // State to store the fetched commodities data
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State to store the input fields (search form)
  const [filters, setFilters] = useState({
    state: 'Maharashtra', // Default value
    district: 'Sangli',   // Default value
    market: '',
    commodity: '',
    variety: '',
    grade: '',
  });

  // Handle search button click and API request
  const fetchData = async (searchFilters) => {
    try {
      setLoading(true);
      setError('');
      console.log('Filters applied:', searchFilters);  // Log applied filters for debugging
  
      const response = await axios.get('https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070', {
        params: {
          'api-key': '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b',
          format: 'json',
          offset: 0,
          limit: 10,
          filters: {
            'state.keyword': searchFilters.state || 'Maharashtra',  // Default to Maharashtra
            district: searchFilters.district || 'Sangli',           // Default to Sangli
            market: searchFilters.market || '',                     // Market filter
            commodity: searchFilters.commodity || '',               // Commodity filter
            variety: searchFilters.variety || '',                   // Variety filter
            grade: searchFilters.grade || ''                        // Grade filter
          },
        },
      });
  
      console.log('API Response:', response.data);  // Log API response to check the data received
      setCommodities(response.data.records);
    } catch (error) {
      setError('Error fetching data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  

  // Fetch data on component mount with default filters
  useEffect(() => {
    fetchData(filters);
  }, []);

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
    fetchData(filters); // Trigger the API call with updated filters
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">Commodities Data</h1>
      
      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* State */}
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="state">
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="district">
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="market">
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="commodity">
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="variety">
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
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="grade">
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
        <table className="min-w-full bg-white shadow-md rounded overflow-hidden mt-6">
          <thead>
            <tr>
              <th className="py-2 px-4 bg-gray-200 text-left">State</th>
              <th className="py-2 px-4 bg-gray-200 text-left">District</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Market</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Commodity</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Variety</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Grade</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Min Price</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Max Price</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Modal Price</th>
              <th className="py-2 px-4 bg-gray-200 text-left">Arrival Date</th>
            </tr>
          </thead>
          <tbody>
            {commodities.map((commodity, index) => (
              <tr key={index} className="border-t">
                <td className="py-2 px-4">{commodity.state}</td>
                <td className="py-2 px-4">{commodity.district}</td>
                <td className="py-2 px-4">{commodity.market}</td>
                <td className="py-2 px-4">{commodity.commodity}</td>
                <td className="py-2 px-4">{commodity.variety}</td>
                <td className="py-2 px-4">{commodity.grade}</td>
                <td className="py-2 px-4">{commodity.min_price}</td>
                <td className="py-2 px-4">{commodity.max_price}</td>
                <td className="py-2 px-4">{commodity.modal_price}</td>
                <td className="py-2 px-4">{commodity.arrival_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Commodities;
