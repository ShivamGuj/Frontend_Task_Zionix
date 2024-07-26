const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  partNumber: String,
  manufacturer: String,
  dataProvider: String,
  volume: Number,
  unitPrice: Number,
  totalPrice: Number,
});

module.exports = mongoose.model("Cart", cartSchema);
