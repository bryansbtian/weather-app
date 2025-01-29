const mongoose = require("mongoose");

const weatherSchema = new mongoose.Schema({
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  temperatures: [{ date: Date, temperature: Number }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Weather", weatherSchema);
