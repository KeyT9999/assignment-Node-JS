const jwt=require('jsonwebtoken');
module.exports=(req,res,next)=>{const value=req.headers.authorization||'';const token=value.startsWith('Bearer ')?value.slice(7):null;
if(!token)return res.status(401).json({message:'Authentication required'});try{req.user=jwt.verify(token,process.env.JWT_SECRET||'pe-secret');next();}catch(e){res.status(401).json({message:'Invalid token'});}};
