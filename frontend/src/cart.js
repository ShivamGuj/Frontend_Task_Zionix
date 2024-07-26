import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [volume, setVolume] = useState();
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/getCart")
      .then((response) => {
        const fetchedCart = [];
        response.data.forEach((item) => {
          fetchedCart.push(item);
        });
        setCart(fetchedCart);
      })
      .catch((error) => {
        console.error("Error fetching cart", error);
      });
  }, []);

  const updateCartVolume = (index) => {
    console.log(volume);
    axios
      .post("http://localhost:5000/api/updatePrice", {
        manufacturer: cart[index].manufacturer,
        partNumber: cart[index].partNumber,
        dataProvider: cart[index].dataProvider,
        volume: volume,
      })
      .then(() => {
        alert("Price updated");
      })
      .catch((error) => {
        console.error("Error updating price", error);
      });
  };

  const handleDelete = (index) => {
    axios
      .post("http://localhost:5000/api/deleteCart", {
        manufacturer: cart[index].manufacturer,
        partNumber: cart[index].partNumber,
        dataProvider: cart[index].dataProvider
      })
      .then(() => {
        alert("Item deleted");
        navigate("/cart", { replace: true });
      })
      .catch((error) => {
        console.error("Error deleting item", error);
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
      </nav>
      <h2 className="text-xl font-semibold underline mt-5 ml-5">My Cart</h2>
      {cart.length === 0 ? (
        <p>No items in cart</p>
      ) : (
        <table className="w-full min-w-max table-auto text-left mt-5">
          <thead className="text-md text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th>Part Number</th>
              <th>Manufacturer</th>
              <th>Data Provider</th>
              <th>Volume</th>
              <th>Unit Price</th>
              <th>Total Price</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr key={index}>
                <td>{item.partNumber}</td>
                <td>{item.manufacturer}</td>
                <td>{item.dataProvider}</td>
                <td>
                  <input
                    type="number"
                    placeholder={item.volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="border"
                  />
                  <button
                    onClick={() => updateCartVolume(index)}
                    className="text-sm text-white bg-blue-600 hover:bg-blue-500"
                  >
                    Enter
                  </button>
                </td>
                <td>{item.unitPrice}</td>
                <td>{item.totalPrice}</td>
                <td>
                  <button
                    onClick={() => handleDelete(index)}
                    className="text-sm text-white bg-blue-600 hover:bg-blue-500"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Cart;
