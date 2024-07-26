const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const Cart = require("./model/cart");

const app = express();
app.use(express.json());
app.use(cors());

const convertCurrency = (price, currency) => {
  const conversionRates = {
    EUR: 90,
    INR: 1,
    USD: 84,
  };

  return price * (conversionRates[currency] || 1);
};

const fetchFromMouser = async (partNumber, volume) => {
  try {
    const response = await axios.post(
      "https://api.mouser.com/api/v1/search/partnumber?apiKey=82675baf-9a58-4d5a-af3f-e3bbcf486560",
      {
        SearchByPartRequest: {
          mouserPartNumber: partNumber,
          partSearchOptions: "string",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;
    console.log(data);
    const part = data.SearchResults.Parts.find(
      (p) => p.ManufacturerPartNumber === partNumber
    );
    const validPriceBreaks = part.PriceBreaks.filter(
      (pb) => volume >= pb.Quantity
    );
    const priceBreak =
      validPriceBreaks[validPriceBreaks.length - 1] ||
      part.PriceBreaks[part.PriceBreaks.length - 1];

    //console.log(part);
    const unitPrice = parseFloat(priceBreak.Price.replace(/[^0-9.]/g, ""));
    console.log(unitPrice);

    return {
      partNumber: part.ManufacturerPartNumber,
      manufacturer: part.Manufacturer,
      dataProvider: "Mouser",
      volume,
      unitPrice,
      currency: priceBreak.Currency,
    };
  } catch (error) {
    console.error("Error fetching from Mouser", error);
    return null;
  }
};

const fetchFromElement14 = async (partNumber, volume) => {
  try {
    const response = await axios.get(
      `http://api.element14.com//catalog/products?term=manuPartNum:${partNumber}&storeInfo.id=in.element14.com&resultsSettings.offset=0&resultsSettings.numberOfResults=1&resultsSettings.refinements.filters=inStock&resultsSettings.responseGroup=medium&callInfo.omitXmlSchema=false&callInfo.callback=&callInfo.responseDataFormat=json&callinfo.apiKey=wb9wt295qf3g6m842896hh2u`
    );
    const data = response.data;
    console.log(data);
    const part = data.manufacturerPartNumberSearchReturn.products.find(
      (p) => p.translatedManufacturerPartNumber === partNumber
    );
    const priceBreak = part.prices.find(
      (pb) => volume >= pb.from && volume <= pb.to
    );

    return {
      partNumber: part.translatedManufacturerPartNumber,
      manufacturer: part.vendorName,
      dataProvider: "Element14",
      volume,
      unitPrice: parseFloat(priceBreak.cost),
      currency: "INR",
    };
  } catch (error) {
    console.error("Error fetching from Element14", error);
    return null;
  }
};

const fetchFromRutronik = async (partNumber, volume) => {
  try {
    const response = await axios.get(
      `https://www.rutronik24.com/api/search/?apikey=cc6qyfg2yfis&searchterm=${partNumber}`
    );

    const data = response.data;
    console.log(data);
    const part = data.find((p) => p.mpn === partNumber);
    
    const validPriceBreaks = part.pricebreaks.filter((pb) => volume >= pb.quantity);
    const priceBreak =
      validPriceBreaks[validPriceBreaks.length - 1] ||
      part.pricebreaks[part.pricebreaks.length - 1];

    console.log("Price",parseFloat(priceBreak.price));

    return {
      partNumber: part.mpn,
      manufacturer: part.manufacturer,
      dataProvider: "Rutronik",
      volume,
      unitPrice: parseFloat(priceBreak.price),
      currency: "EUR",
    };
  } catch (error) {
    console.error("Error fetching from Rutronik", error);
    return null;
  }
};

app.post("/api/getPrices", async (req, res) => {
  const { partNumber, volume } = req.body;

  const promises = [
    fetchFromMouser(partNumber, volume),
    fetchFromElement14(partNumber, volume),
    fetchFromRutronik(partNumber, volume),
  ];

  try {
    const results = await Promise.all(promises);
    const filteredResults = results.filter((result) => result !== null);

    const formattedResults = filteredResults.map((result) => ({
      partNumber: result.partNumber,
      manufacturer: result.manufacturer,
      dataProvider: result.dataProvider,
      volume: result.volume,
      unitPrice: convertCurrency(result.unitPrice, result.currency),
      totalPrice:
        convertCurrency(result.unitPrice, result.currency) * result.volume,
    }));

    const sortedResults = formattedResults.sort(
      (a, b) => a.totalPrice - b.totalPrice
    );

    res.json(sortedResults);
  } catch (error) {
    console.error("Error fetching prices", error);
    res.status(500).json({ error: "Failed to fetch prices" });
  }
});

mongoose
  .connect('mongodb+srv://shivamgujaria4:shivamguj14@cluster0.vnst7t6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: {
      version: "1",
      strict: true,
      deprecationErrors: true,
    },
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB", err);
  });

app.post("/api/uploadPrice", async (req, res) => {
  const {
    partNumber,
    manufacturer,
    dataProvider,
    volume,
    unitPrice,
    totalPrice,
  } = req.body;
  const cart = new Cart({
    partNumber,
    manufacturer,
    dataProvider,
    volume,
    unitPrice,
    totalPrice,
  });
  console.log(cart);
  await cart.save();
});

app.get("/api/getCart", async (req, res) => {
  try {
    const cart = await Cart.find();
    res.json(cart);
  } catch (error) {
    console.error("Error fetching cart", error);
    res.status(500).json({ error: "Failed to fetch cart" });
  }
});

app.post("/api/updatePrice", async (req, res) => {
  const {
    manufacturer,
    partNumber,
    dataProvider,
    volume,
  } = req.body;

  console.log(req.body);

  let promises = [];
  if (dataProvider === "Mouser") {
    promises = [fetchFromMouser(partNumber, volume)];
  } else if (dataProvider === "Element14") {
    promises = [fetchFromElement14(partNumber, volume)];
  } else if (dataProvider === "Rutronik") {
    promises = [fetchFromRutronik(partNumber, volume)];
  }

  try {
    const results = await Promise.all(promises);
    const filteredResults = results.filter((result) => result !== null);

    if (filteredResults.length > 0) {
      const bestResult = filteredResults.reduce((prev, curr) => {
        const prevPrice = convertCurrency(prev.unitPrice, prev.currency);
        const currPrice = convertCurrency(curr.unitPrice, curr.currency);
        return prevPrice < currPrice ? prev : curr;
      });

      const unitPrice = convertCurrency(bestResult.unitPrice, bestResult.currency);
      const totalPrice = unitPrice * volume;

      await Cart.findOneAndUpdate(
        { partNumber, manufacturer, dataProvider },
        { volume, unitPrice, totalPrice },
        { new: true }
      );
    } else {
      res.status(404).json({ error: "Price not found" });
    }
  } catch (error) {
    console.error("Error updating price", error);
    res.status(500).json({ error: "Failed to update price" });
  }
});

app.post('/api/deleteCart', async (req, res) => {
    const { manufacturer, partNumber, dataProvider } = req.body;
    try
    {
        await Cart.deleteOne({ manufacturer, partNumber, dataProvider });
        res.json({ message: "Item deleted" });
    }
    catch (error)
    {
        console.error("Error deleting item", error);
        res.status(500).json({ error: "Failed to delete item" });
    }
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
