import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";

function SellerNegotiations() {
  const [negotiations, setNegotiations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cookies] = useCookies(["email"]);

  useEffect(() => {
    const fetchNegotiations = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/negotiation?email=${cookies.email}`
        );
        setNegotiations(res.data.negotiations || []);
      } catch (error) {
        console.error("Error fetching negotiations:", error);
        setNegotiations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNegotiations();
  }, [cookies.email]);

  const handleStatusChange = async (negotiationId, newStatus) => {
    try {
      const res = await axios.patch(`http://localhost:8000/negotiation/${negotiationId}`, {
        status: newStatus,
      });
      // Update the negotiation in the local state with the response from backend
      setNegotiations((prev) =>
        prev.map((n) =>
          n._id === negotiationId ? { ...n, status: res.data.negotiation.status } : n
        )
      );
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div>Loading negotiations...</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Negotiations</h2>
      {negotiations.length === 0 ? (
        <div>No negotiations found.</div>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">Product</th>
              <th className="border px-2 py-1">User Name</th>
              <th className="border px-2 py-1">User Email</th>
              <th className="border px-2 py-1">Actual Price</th>
              <th className="border px-2 py-1">Negotiated Price</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {negotiations.map((n) => (
              <tr key={n._id}>
                <td className="border px-2 py-1">{n.productId?.name}</td>
                <td className="border px-2 py-1">{n.userId?.name}</td>
                <td className="border px-2 py-1">{n.userId?.email}</td>
                <td className="border px-2 py-1">{n.actualPrice}</td>
                <td className="border px-2 py-1">{n.negotiatedPrice}</td>
                <td className="border px-2 py-1">
                  <select
                    value={n.status}
                    onChange={(e) =>
                      handleStatusChange(n._id, e.target.value)
                    }
                    className="border rounded px-2 py-1"
                  >
                    <option value="pending">Pending</option>
                    <option value="accepted">Accept</option>
                    <option value="rejected">Reject</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SellerNegotiations;