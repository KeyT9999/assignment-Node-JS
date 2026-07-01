const jwt = require("jsonwebtoken");
const User = require("../models/userModel");


const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,      
            role: user.role    
        },
        process.env.JWT_SECRET, 
        {
            expiresIn: process.env.JWT_EXPIRES || "1d" 
        }
    );
};




const register = async (req, res) => {
    try {
        const { username, password, role } = req.body;

        
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        
        const selectedRole = role || "customer";

        
        if (!["admin", "customer"].includes(selectedRole)) {
            return res.status(400).json({
                message: "Role must be admin or customer"
            });
        }

        
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).json({
                message: "Username already exists" 
            });
        }

        
        
        
        const balance = selectedRole === "customer" ? 50 : 0;

        
        const user = await User.create({
            username,
            password,
            role: selectedRole,
            balance
        });

        
        res.status(201).json({
            message: "Register successfully",
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                balance: user.balance
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Register failed",
            error: error.message
        });
    }
};




const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        
        const user = await User.findOne({ username });

        
        if (!user) {
            return res.status(401).json({
                message: "Invalid username or password" 
            });
        }

        
        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        
        const token = generateToken(user);

        
        res.status(200).json({
            message: "Login successfully",
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                balance: user.balance
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    register,
    login
};

