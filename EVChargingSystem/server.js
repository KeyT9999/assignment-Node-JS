require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const stationRoutes = require("./routes/stationRoutes");
const sessionRoutes = require("./routes/sessionRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.status(200).json({
        message: "EV Charging System API is running"
    });
});

app.use("/auth", authRoutes);
app.use("/stations", stationRoutes);
app.use("/sessions", sessionRoutes);

app.use((req, res) => {
    res.status(404).json({
        message: "Route not found"
    });
});

const PORT = process.env.PORT || 9999;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});