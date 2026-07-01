const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const userSchema = new mongoose.Schema({
    
    username: {
        type: String,
        required: [true, "Username is required"], 
        unique: true,                             
        trim: true                                
    },

    
    password: {
        type: String,
        required: [true, "Password is required"]  
    },

    
    role: {
        type: String,
        enum: ["admin", "customer"],              
        default: "customer"                       
    },

    
    createdAt: {
        type: Date,
        default: Date.now                         
    },

    
    balance: {
        type: Number,
        default: 0                                
    }
});


userSchema.pre("save", async function () {
    
    if (!this.isModified("password")) {
        return;
    }

    
    this.password = await bcrypt.hash(this.password, 10);
});


userSchema.methods.comparePassword = async function (inputPassword) {
    return bcrypt.compare(inputPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);