const mongoose = require("mongoose");


const sessionSchema = new mongoose.Schema({
  
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",                                
    required: [true, "User ID is required"]     
  },

  
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Station",                             
    required: [true, "Station ID is required"]  
  },

  
  startTime: {
    type: Date,
    required: [true, "Start time is required"]  
  },

  
  endTime: {
    type: Date,
    required: [true, "End time is required"]    
  },

  
  energyEstimate: {
    type: Number,
    required: [true, "Energy estimate is required"] 
  },

  
  totalCost: {
    type: Number,
    required: [true, "Total cost is required"]      
  },

  
  status: {
    type: String,
    default: "pending"
  }
});

module.exports = mongoose.model("Session", sessionSchema);
