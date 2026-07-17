const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "customer"] , default: "customer"},
  createdAt: { type: Date , default: Date.now},
});

schema.pre('save',async function(next){if(!this.isModified('password'))return next();this.password=await bcrypt.hash(this.password,10);next()});
schema.methods.comparePassword=function(v){return bcrypt.compare(v,this.password)};
module.exports = mongoose.model('User', schema);
