const mongoose = require("mongoose");

const stationSchema = new mongoose.Schema({
    stationCode: {
        type: String,
        required: [true, "Station code is required"],
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["FastCharge", "NormalCharge"],
        required: [true, "Station type is required"]
    },
    status: {
        type: String,
        enum: ["available", "maintenance", "offline"],
        default: "available"
    },
    pricePerKwh: {
        type: Number,
        required: [true, "Price per kWh is required"],
        min: [0, "Price must be positive"]
    },
    connectors: {
        type: [String],
        required: true,
        enum: ["Type2", "CCS2", "CHAdeMO"]
    },
    isOccupied: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("Station", stationSchema);