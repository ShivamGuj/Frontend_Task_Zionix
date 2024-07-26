import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const App = () => {
  const [partNumber, setPartNumber] = useState("");
  const [volume, setVolume] = useState();
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  const handleEnter = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/getPrices", {
        partNumber,
        volume,
      });
      setResults(response.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const handleAddToCart = (item) => {
    console.log(item);
    axios.post("http://localhost:5000/api/uploadPrice", item
    ).then(
      alert("Added to cart")
    ).catch((error) => {
      console.error("Error adding to cart", error);
    });
  };

  return (
    <div>
      <nav className="flex flex-row gap-5 p-2">
        <button
          onClick={() => navigate("/")}
          className="border rounded p-2 bg-blue-600 hover:bg-blue-500 text-white"
        >
          Home
        </button>
        <button
          onClick={() => navigate("/cart")}
          className="border rounded p-2 bg-blue-600 hover:bg-blue-500 text-white"
        >
          Cart
        </button>
      </nav>
      <div className="flex flex-col">
        <div className="flex flex-row gap-3 p-2">
          <span className="mt-2">Part Number: </span>
          <input
            type="text"
            value={partNumber}
            placeholder="Enter the Part Number"
            onChange={(e) => setPartNumber(e.target.value)}
            className="border w-[30vw] p-2"
          />
        </div>
        <div className="flex flex-row gap-3 p-2">
          <span className="mt-2">Volume: </span>
          <input
            type="number"
            value={volume}
            placeholder="Enter the Volume"
            onChange={(e) => setVolume(e.target.value)}
            className="border w-[30vw] p-2"
          />
        </div>
        <button
          onClick={handleEnter}
          className="w-[20vw] border p-2 ml-20 mt-5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
        >
          ENTER
        </button>
      </div>
      <div className="mt-5">
        <table className="w-full min-w-max table-auto text-left">
          <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th>Part Number</th>
              <th>Manufacturer</th>
              <th>Data Provider</th>
              <th>Volume</th>
              <th>Unit Price</th>
              <th>Total Price</th>
              <th>Add to Cart</th>
            </tr>
          </thead>
          {results.length > 0 && (
            <tbody>
              {results.map((result, index) => (
                <tr key={index}>
                  <td>{result.partNumber}</td>
                  <td>{result.manufacturer}</td>
                  <td>{result.dataProvider}</td>
                  <td>{result.volume}</td>
                  <td>{result.unitPrice}</td>
                  <td>{result.totalPrice}</td>
                  {index === 0 && (
                    <td>
                      <button
                        onClick={() => handleAddToCart(results[0])}
                        className="border rounded p-1 bg-blue-600 hover:bg-blue-500 text-white"
                      >
                        Add to Cart
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  );
};

export default App;
