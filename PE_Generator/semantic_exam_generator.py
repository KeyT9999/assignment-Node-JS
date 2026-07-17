"""Offline generators for rule-heavy PE exam families.

These are selected by semantic domain, never by network/LLM calls.  Each family
keeps its own invariants so a time-booking template cannot silently stand in for
inventory, queue, appointment, or seat-allocation logic.
"""
import json
import os


PACKAGE = {
    "scripts": {"start": "node server.js", "dev": "nodemon server.js"},
    "dependencies": {"bcryptjs": "^2.4.3", "dotenv": "^16.4.5", "express": "^4.19.2", "jsonwebtoken": "^9.0.2", "mongoose": "^8.5.1"},
    "devDependencies": {"nodemon": "^3.1.4"},
}


def _model(name, fields):
    return "const mongoose = require('mongoose');\nconst schema = new mongoose.Schema({\n" + \
        ",\n".join(f"  {key}: {value}" for key, value in fields.items()) + \
        "\n}, { timestamps: true });\nmodule.exports = mongoose.model('" + name + "', schema);\n"


USER_FIELDS = {
    "username": "{ type: String, required: true, unique: true, trim: true }",
    "password": "{ type: String, required: true }",
    "role": "{ type: String, required: true }",
    "createdAt": "{ type: Date, default: Date.now }",
}


AUTH_CONTROLLER = """const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
exports.register = async (req,res) => { try {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({message:'username and password are required'});
  if (await User.findOne({username})) return res.status(409).json({message:'Username already exists'});
  const user = await User.create({username, password:await bcrypt.hash(password,10), role:'__DEFAULT_ROLE__'__BALANCE____EXTRA_USER__});
  res.status(201).json({id:user._id,username:user.username,role:user.role});
} catch(e){res.status(500).json({message:e.message});} };
exports.login = async (req,res) => { try {
  const user=await User.findOne({username:req.body.username});
  if(!user || !(await bcrypt.compare(req.body.password,user.password))) return res.status(401).json({message:'Invalid credentials'});
  const token=jwt.sign({userId:user._id,role:user.role},process.env.JWT_SECRET||'pe-secret',{expiresIn:'1d'});
  res.json({token});
} catch(e){res.status(500).json({message:e.message});} };
"""


AUTH_MIDDLEWARE = """const jwt=require('jsonwebtoken');
module.exports=(req,res,next)=>{const value=req.headers.authorization||'';const token=value.startsWith('Bearer ')?value.slice(7):null;
if(!token)return res.status(401).json({message:'Authentication required'});try{req.user=jwt.verify(token,process.env.JWT_SECRET||'pe-secret');next();}catch(e){res.status(401).json({message:'Invalid token'});}};
"""


RESOURCE_CONTROLLER = """const Model=require('../models/__RESOURCE__Model');
exports.list=async(req,res)=>res.json(await Model.find());
exports.create=async(req,res)=>{try{res.status(201).json(await Model.create(req.body));}catch(e){res.status(400).json({message:e.message});}};
"""


DOMAIN = {
"sports_court_booking": {
 "role":"customer", "resource":"court", "tx":"booking", "resource_route":"/courts", "tx_route":"/bookings",
 "resource_fields":{"courtCode":"{ type: String, required: true, unique: true }","sportType":"{ type: String, enum: ['badminton','tennis','basketball'], required: true }","capacity":"{ type: Number, required: true }","status":"{ type: String, enum: ['available','maintenance'], default: 'available' }","pricePerHour":"{ type: Number, required: true }","amenities":"[String]"},
 "tx_fields":{"userId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","courtId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'Court', required: true }","startTime":"{ type: Date, required: true }","endTime":"{ type: Date, required: true }","numberOfPlayers":"{ type: Number, required: true }","totalAmount":"{ type: Number, required: true }","refundAmount":"{ type: Number, default: 0 }","status":"{ type: String, enum: ['confirmed','cancelled','completed'], default: 'confirmed' }","note":"String"},
 "controller":"""const Booking=require('../models/bookingModel');const Court=require('../models/courtModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{userId:req.user.userId};res.json(await Booking.find(q).populate('courtId'));};
exports.create=async(req,res)=>{const {courtId,startTime,endTime,numberOfPlayers,note}=req.body,start=new Date(startTime),end=new Date(endTime),hours=(end-start)/3600000;if(start>=end||start<new Date()||hours>3)return res.status(400).json({message:'Invalid booking time or duration'});const court=await Court.findById(courtId);if(!court)return res.status(404).json({message:'Court not found'});if(court.status==='maintenance'||numberOfPlayers>court.capacity)return res.status(400).json({message:'Court unavailable or capacity exceeded'});if(await Booking.exists({courtId,status:'confirmed',startTime:{$lt:end},endTime:{$gt:start}}))return res.status(409).json({message:'Court is already booked'});let totalAmount=hours*court.pricePerHour;const hour=start.getHours();if(hour>=17&&hour<21)totalAmount*=1.2;res.status(201).json(await Booking.create({userId:req.user.userId,courtId,startTime:start,endTime:end,numberOfPlayers,totalAmount,note,status:'confirmed'}));};
exports.cancel=async(req,res)=>{const b=await Booking.findById(req.params.id);if(!b)return res.status(404).json({message:'Booking not found'});if(req.user.role!=='admin'&&String(b.userId)!==String(req.user.userId))return res.status(403).json({message:'Owner or Admin only'});if(['cancelled','completed'].includes(b.status))return res.status(400).json({message:'Booking cannot be cancelled'});const hours=(b.startTime-new Date())/3600000;b.refundAmount=hours>24?b.totalAmount:hours>=6?b.totalAmount*.5:0;b.status='cancelled';await b.save();res.json(b);};
""", "routes":[("get","/","list"),("post","/","create"),("patch","/:id/cancel","cancel")]},
"parcel_delivery": {
 "role":"customer", "resource":"deliveryZone", "tx":"shipment", "resource_route":"/delivery-zones", "tx_route":"/shipments",
 "resource_fields":{"zoneCode":"{ type: String, required: true, unique: true }","zoneName":"{ type: String, required: true }","status":"{ type: String, enum: ['active','suspended'], default: 'active' }","maxWeightKg":"{ type: Number, required: true }","baseFee":"{ type: Number, required: true }","feePerKm":"{ type: Number, required: true }","feePerKg":"{ type: Number, required: true }"},
 "tx_fields":{"userId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","zoneId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'DeliveryZone', required: true }","receiverName":"{ type: String, required: true }","receiverAddress":"{ type: String, required: true }","distanceKm":"{ type: Number, required: true }","weightKg":"{ type: Number, required: true }","deliveryType":"{ type: String, enum: ['standard','express'], required: true }","declaredValue":"{ type: Number, required: true, min: 0 }","totalFee":"{ type: Number, required: true }","status":"{ type: String, enum: ['pending','accepted','in_transit','delivered','cancelled'], default: 'pending' }","createdAt":"{ type: Date, default: Date.now }"},
 "controller":"""const Shipment=require('../models/shipmentModel');const DeliveryZone=require('../models/deliveryZoneModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{userId:req.user.userId};res.json(await Shipment.find(q).populate('zoneId'));};
exports.create=async(req,res)=>{const {zoneId,receiverName,receiverAddress,distanceKm,weightKg,deliveryType,declaredValue}=req.body;if(!receiverName||!receiverAddress||distanceKm<=0||weightKg<=0||declaredValue<0)return res.status(400).json({message:'Invalid shipment input'});const zone=await DeliveryZone.findById(zoneId);if(!zone)return res.status(404).json({message:'Delivery zone not found'});if(zone.status==='suspended'||weightKg>zone.maxWeightKg)return res.status(400).json({message:'Zone suspended or parcel overweight'});let totalFee=zone.baseFee+distanceKm*zone.feePerKm+weightKg*zone.feePerKg;if(deliveryType==='express')totalFee*=1.4;if(declaredValue>2000000)totalFee+=declaredValue*.01;res.status(201).json(await Shipment.create({userId:req.user.userId,zoneId,receiverName,receiverAddress,distanceKm,weightKg,deliveryType,declaredValue,totalFee,status:'pending'}));};
exports.updateStatus=async(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({message:'Admin only'});const s=await Shipment.findById(req.params.id);if(!s)return res.status(404).json({message:'Shipment not found'});const next=req.body.status,flow={pending:'accepted',accepted:'in_transit',in_transit:'delivered'};if(!((s.status==='pending'&&next==='cancelled')||flow[s.status]===next))return res.status(400).json({message:'Invalid status transition'});s.status=next;await s.save();res.json(s);};
""", "routes":[("get","/","list"),("post","/","create"),("patch","/:id/status","updateStatus")]},
"course_enrollment": {
 "role":"student", "resource":"course", "tx":"enrollment", "resource_route":"/courses", "tx_route":"/enrollments", "user_fields":{"studentCode":"String"},
 "resource_fields":{"courseCode":"{ type: String, required: true, unique: true }","title":"{ type: String, required: true }","capacity":"{ type: Number, required: true }","fee":"{ type: Number, required: true }","startDate":"{ type: Date, required: true }","status":"{ type: String, enum: ['open','closed','cancelled'], default: 'open' }","prerequisiteCodes":"[String]"},
 "tx_fields":{"studentId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","courseId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }","enrolledAt":"{ type: Date, default: Date.now }","totalFee":"{ type: Number, required: true }","status":"{ type: String, enum: ['enrolled','completed','dropped'], default: 'enrolled' }","finalScore":"{ type: Number, default: null }"},
 "controller":"""const Enrollment=require('../models/enrollmentModel');const Course=require('../models/courseModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{studentId:req.user.userId};res.json(await Enrollment.find(q).populate('courseId'));};
exports.create=async(req,res)=>{const course=await Course.findById(req.body.courseId);if(!course)return res.status(404).json({message:'Course not found'});if(course.status!=='open'||course.startDate<=new Date())return res.status(400).json({message:'Course is not open for enrollment'});if(await Enrollment.exists({studentId:req.user.userId,courseId:course._id,status:{$in:['enrolled','completed']}}))return res.status(409).json({message:'Duplicate enrollment'});if(await Enrollment.countDocuments({courseId:course._id,status:'enrolled'})>=course.capacity)return res.status(409).json({message:'Course capacity reached'});for(const code of (course.prerequisiteCodes||[])){const prerequisite=await Course.findOne({courseCode:code});if(!prerequisite||!await Enrollment.exists({studentId:req.user.userId,courseId:prerequisite._id,status:'completed',finalScore:{$gte:5}}))return res.status(400).json({message:'Prerequisite not completed'});}const days=(course.startDate-new Date())/86400000,totalFee=days>=14?course.fee*.9:course.fee;res.status(201).json(await Enrollment.create({studentId:req.user.userId,courseId:course._id,totalFee,status:'enrolled'}));};
exports.complete=async(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({message:'Admin only'});const score=Number(req.body.finalScore);if(score<0||score>10)return res.status(400).json({message:'finalScore must be from 0 to 10'});const e=await Enrollment.findById(req.params.id);if(!e)return res.status(404).json({message:'Enrollment not found'});if(['completed','dropped'].includes(e.status))return res.status(400).json({message:'Enrollment cannot be completed'});e.status='completed';e.finalScore=score;await e.save();res.json(e);};
""", "routes":[("get","/","list"),("post","/","create"),("patch","/:id/complete","complete")]},
"bicycle_sharing": {
 "role":"customer", "resource":"bicycle", "tx":"trip", "resource_route":"/bicycles", "tx_route":"/trips", "balance":True,
 "resource_fields":{"bikeCode":"{ type: String, required: true, unique: true }","type":"{ type: String, enum: ['standard','electric'], required: true }","status":"{ type: String, enum: ['available','rented','maintenance'], default: 'available' }","stationName":"{ type: String, required: true }","batteryLevel":"Number","unlockFee":"{ type: Number, required: true }"},
 "tx_fields":{"userId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","bicycleId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'Bicycle', required: true }","startTime":"{ type: Date, default: Date.now }","endTime":"{ type: Date, default: null }","startStation":"{ type: String, required: true }","endStation":"{ type: String, default: null }","totalCost":"{ type: Number, default: 0 }","status":"{ type: String, enum: ['active','completed'], default: 'active' }"},
 "controller":"""const mongoose=require('mongoose');const Trip=require('../models/tripModel');const Bicycle=require('../models/bicycleModel');const User=require('../models/userModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{userId:req.user.userId};res.json(await Trip.find(q).populate('bicycleId'));};
exports.start=async(req,res)=>{const user=await User.findById(req.user.userId),bike=await Bicycle.findById(req.body.bicycleId);if(!bike)return res.status(404).json({message:'Bicycle not found'});if(bike.status!=='available'||(bike.type==='electric'&&bike.batteryLevel<20))return res.status(400).json({message:'Bicycle unavailable'});if(await Trip.exists({userId:user._id,status:'active'}))return res.status(409).json({message:'Customer already has an active trip'});if(user.balance<20000)return res.status(402).json({message:'Minimum wallet balance is 20000'});const session=await mongoose.startSession();let trip;try{await session.withTransaction(async()=>{[trip]=await Trip.create([{userId:user._id,bicycleId:bike._id,startTime:new Date(),startStation:bike.stationName,status:'active'}],{session});bike.status='rented';await bike.save({session});});res.status(201).json(trip);}finally{await session.endSession();}};
exports.complete=async(req,res)=>{const {endStation}=req.body;if(!endStation)return res.status(400).json({message:'endStation is required'});const trip=await Trip.findById(req.params.id);if(!trip)return res.status(404).json({message:'Trip not found'});if(req.user.role!=='admin'&&String(trip.userId)!==String(req.user.userId))return res.status(403).json({message:'Owner or Admin only'});if(trip.status==='completed')return res.status(400).json({message:'Trip already completed'});const bike=await Bicycle.findById(trip.bicycleId),user=await User.findById(trip.userId),now=new Date(),minutes=(now-trip.startTime)/60000;let totalCost=bike.unlockFee+10000+Math.max(0,Math.ceil((minutes-30)/15))*5000;if(bike.type==='electric')totalCost*=1.2;if(user.balance<totalCost)return res.status(402).json({message:'Payment Required'});const session=await mongoose.startSession();try{await session.withTransaction(async()=>{user.balance-=totalCost;trip.endTime=now;trip.endStation=endStation;trip.totalCost=totalCost;trip.status='completed';bike.status='available';bike.stationName=endStation;await user.save({session});await trip.save({session});await bike.save({session});});res.json(trip);}finally{await session.endSession();}};
""", "routes":[("get","/","list"),("post","/start","start"),("patch","/:id/complete","complete")]},
"dental_appointment": {
 "role":"patient", "resource":"dentist", "tx":"appointment", "resource_route":"/dentists", "tx_route":"/appointments",
 "resource_fields": {
  "dentistCode":"{ type: String, required: true, unique: true }", "fullName":"{ type: String, required: true }", "specialty":"{ type: String, required: true }",
  "status":"{ type: String, enum: ['available','on_leave','retired'], default: 'available' }", "consultationFee":"{ type: Number, required: true, min: 0 }",
  "workingStartHour":"{ type: Number, required: true }", "workingEndHour":"{ type: Number, required: true }"},
 "tx_fields": {"userId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }", "dentistId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'Dentist', required: true }", "startTime":"{ type: Date, required: true }", "durationMinutes":"{ type: Number, enum: [30,60,90], required: true }", "serviceType":"{ type: String, required: true }", "completedAt":"{ type: Date, default: null }", "totalFee":"{ type: Number, default: 0 }", "status":"{ type: String, enum: ['scheduled','completed','cancelled'], default: 'scheduled' }", "note":"String"},
 "controller": """const Appointment=require('../models/appointmentModel'); const Dentist=require('../models/dentistModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{userId:req.user.userId};res.json(await Appointment.find(q).populate('dentistId'));};
exports.book=async(req,res)=>{try{const {dentistId,startTime,durationMinutes,serviceType,note}=req.body;const start=new Date(startTime);const duration=Number(durationMinutes);
if(start<=new Date()||![30,60,90].includes(duration))return res.status(400).json({message:'Invalid startTime or durationMinutes'});
const dentist=await Dentist.findById(dentistId);if(!dentist)return res.status(404).json({message:'Dentist not found'});if(['on_leave','retired'].includes(dentist.status))return res.status(400).json({message:'Dentist is unavailable'});
const end=new Date(start.getTime()+duration*60000);const startHour=start.getHours()+start.getMinutes()/60;const endHour=end.getHours()+end.getMinutes()/60;if(startHour<dentist.workingStartHour||endHour>dentist.workingEndHour)return res.status(400).json({message:'Appointment is outside working hours'});
const conflicts=await Appointment.find({dentistId,status:'scheduled'});if(conflicts.some(a=>start<new Date(new Date(a.startTime).getTime()+a.durationMinutes*60000)&&end>a.startTime))return res.status(409).json({message:'This dentist is unavailable during the requested time.'});
res.status(201).json(await Appointment.create({userId:req.user.userId,dentistId,startTime:start,durationMinutes:duration,serviceType,note,status:'scheduled'}));}catch(e){res.status(500).json({message:e.message});}};
exports.complete=async(req,res)=>{const a=await Appointment.findById(req.params.id);if(!a)return res.status(404).json({message:'Appointment not found'});if(a.status==='completed')return res.status(400).json({message:'Appointment already completed'});const d=await Dentist.findById(a.dentistId);const surcharge={consultation:0,teeth_cleaning:200000,whitening:800000,extraction:500000}[a.serviceType]||0;a.completedAt=new Date();a.status='completed';a.totalFee=d.consultationFee+surcharge;await a.save();res.json(a);};
""",
 "routes":[("get","/","list"),("post","/book","book"),("put","/:id/complete","complete")]},
"parking": {
 "role":"customer", "resource":"parkingSlot", "tx":"parkingSession", "resource_route":"/parking-slots", "tx_route":"/parking-sessions", "balance":True,
 "resource_fields":{"slotCode":"{ type: String, required: true, unique: true }","vehicleType":"{ type: String, enum: ['motorbike','car','electric_car'], required: true }","status":"{ type: String, enum: ['available','maintenance','offline'], default: 'available' }","pricePerHour":"{ type: Number, required: true }","hasChargingPort":"{ type: Boolean, default: false }","location":"{ type: String, required: true }"},
 "tx_fields":{"userId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","slotId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true }","startTime":"{ type: Date, required: true }","endTime":"{ type: Date, required: true }","vehiclePlate":"{ type: String, required: true }","totalCost":"{ type: Number, required: true }","status":"{ type: String, enum: ['booked','completed','cancelled'], default: 'booked' }"},
 "controller":"""const Session=require('../models/parkingSessionModel');const Slot=require('../models/parkingSlotModel');const User=require('../models/userModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{userId:req.user.userId};res.json(await Session.find(q).populate('slotId'));};
exports.book=async(req,res)=>{try{const {slotId,startTime,endTime,vehiclePlate}=req.body;const start=new Date(startTime),end=new Date(endTime);if(!vehiclePlate||start>=end||start<new Date())return res.status(400).json({message:'Invalid time range or vehiclePlate'});const slot=await Slot.findById(slotId);if(!slot)return res.status(404).json({message:'Slot not found'});if(['maintenance','offline'].includes(slot.status))return res.status(400).json({message:'Slot is unavailable'});if(await Session.exists({slotId,status:'booked',startTime:{$lt:end},endTime:{$gt:start}}))return res.status(409).json({message:'Parking slot is already booked'});
const durationMinutes=(end-start)/60000,billingBlocks=Math.ceil(durationMinutes/30),blockPrice=slot.pricePerHour/2;let totalCost=billingBlocks*blockPrice;const hour=start.getHours();if((hour>=7&&hour<9)||(hour>=17&&hour<20))totalCost*=1.25;else if(hour>=22||hour<5)totalCost*=0.8;totalCost=Math.round(totalCost);
const user=await User.findById(req.user.userId);if(user.balance<totalCost)return res.status(402).json({message:'Payment Required: Insufficient wallet balance'});user.balance-=totalCost;await user.save();res.status(201).json(await Session.create({userId:user._id,slotId,startTime:start,endTime:end,vehiclePlate,totalCost,status:'booked'}));}catch(e){res.status(500).json({message:e.message});}};
""", "routes":[("get","/","list"),("post","/book","book")]},
"workshop_registration": {
 "role":"student", "resource":"workshop", "tx":"registration", "resource_route":"/workshops", "tx_route":"/registrations",
 "resource_fields":{"title":"{ type: String, required: true }","eventDate":"{ type: Date, required: true }","location":"{ type: String, required: true }","maximumCapacity":"{ type: Number, required: true, min: 1 }","registrationDeadline":"{ type: Date, required: true }","status":"{ type: String, enum: ['open','closed','cancelled'], default: 'open' }"},
 "tx_fields":{"studentId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","workshopId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'Workshop', required: true }","registrationDate":"{ type: Date, default: Date.now }","status":"{ type: String, enum: ['confirmed','waiting','cancelled'], required: true }"},
 "controller":"""const Registration=require('../models/registrationModel');const Workshop=require('../models/workshopModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{studentId:req.user.userId};res.json(await Registration.find(q).populate('workshopId'));};
exports.create=async(req,res)=>{const workshop=await Workshop.findById(req.body.workshopId);if(!workshop)return res.status(404).json({message:'Workshop not found'});if(workshop.status!=='open'||new Date()>workshop.registrationDeadline)return res.status(400).json({message:'Registration is closed'});if(await Registration.exists({studentId:req.user.userId,workshopId:workshop._id,status:{$ne:'cancelled'}}))return res.status(409).json({message:'Duplicate registration'});const count=await Registration.countDocuments({workshopId:workshop._id,status:'confirmed'});const status=count<workshop.maximumCapacity?'confirmed':'waiting';res.status(201).json(await Registration.create({studentId:req.user.userId,workshopId:workshop._id,status}));};
exports.cancel=async(req,res)=>{const r=await Registration.findById(req.params.id);if(!r)return res.status(404).json({message:'Registration not found'});if(String(r.studentId)!==String(req.user.userId))return res.status(403).json({message:'You can cancel only your registration'});if(r.status==='cancelled')return res.status(400).json({message:'Registration already cancelled'});const promote=r.status==='confirmed';r.status='cancelled';await r.save();if(promote){const next=await Registration.findOne({workshopId:r.workshopId,status:'waiting'}).sort({registrationDate:1});if(next){next.status='confirmed';await next.save();}}res.json(r);};
""", "routes":[("get","/","list"),("post","/","create"),("delete","/:id","cancel")]},
"food_delivery": {
 "role":"customer", "resource":"menuItem", "tx":"order", "resource_route":"/menu-items", "tx_route":"/orders",
 "resource_fields":{"itemCode":"{ type: String, required: true, unique: true }","name":"{ type: String, required: true }","category":"{ type: String, enum: ['food','drink','dessert'], required: true }","price":"{ type: Number, required: true, min: 0 }","stockQuantity":"{ type: Number, required: true, min: 0 }","status":"{ type: String, enum: ['available','unavailable'], default: 'available' }","createdAt":"{ type: Date, default: Date.now }"},
 "tx_fields":{"userId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","items":"[{ menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true }, quantity: { type: Number, required: true, min: 1 }, unitPrice: { type: Number, required: true }, lineTotal: { type: Number, required: true } }]","deliveryAddress":"{ type: String, required: true }","subtotal":"{ type: Number, required: true }","deliveryFee":"{ type: Number, required: true }","totalAmount":"{ type: Number, required: true }","status":"{ type: String, enum: ['pending','confirmed','preparing','delivering','completed','cancelled'], default: 'pending' }","createdAt":"{ type: Date, default: Date.now }"},
 "controller":"""const mongoose=require('mongoose');const Order=require('../models/orderModel');const MenuItem=require('../models/menuItemModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{userId:req.user.userId};res.json(await Order.find(q).populate('items.menuItemId'));};
exports.create=async(req,res)=>{const {items,deliveryAddress}=req.body;if(!Array.isArray(items)||items.length===0||!deliveryAddress||items.some(i=>!Number.isInteger(i.quantity)||i.quantity<=0))return res.status(400).json({message:'Items, positive integer quantities, and deliveryAddress are required'});const session=await mongoose.startSession();try{let created;await session.withTransaction(async()=>{const lines=[];let subtotal=0;for(const requested of items){const menuItem=await MenuItem.findById(requested.menuItemId).session(session);if(!menuItem||menuItem.status!=='available'||menuItem.stockQuantity<requested.quantity)throw Object.assign(new Error('Menu item unavailable or insufficient stock'),{status:400});const unitPrice=menuItem.price,lineTotal=unitPrice*requested.quantity;subtotal+=lineTotal;lines.push({menuItemId:menuItem._id,quantity:requested.quantity,unitPrice,lineTotal});menuItem.stockQuantity-=requested.quantity;await menuItem.save({session});}const deliveryFee=subtotal>=300000?0:30000;[created]=await Order.create([{userId:req.user.userId,items:lines,deliveryAddress,subtotal,deliveryFee,totalAmount:subtotal+deliveryFee,status:'pending'}],{session});});res.status(201).json(created);}catch(e){res.status(e.status||500).json({message:e.message});}finally{await session.endSession();}};
exports.updateStatus=async(req,res)=>{if(req.user.role!=='admin')return res.status(403).json({message:'Admin only'});const order=await Order.findById(req.params.id);if(!order)return res.status(404).json({message:'Order not found'});const next=req.body.status,flow={pending:'confirmed',confirmed:'preparing',preparing:'delivering',delivering:'completed'};const canCancel=['pending','confirmed'].includes(order.status)&&next==='cancelled';if(flow[order.status]!==next&&!canCancel)return res.status(400).json({message:'Invalid status transition'});if(canCancel){const session=await mongoose.startSession();try{await session.withTransaction(async()=>{for(const line of order.items)await MenuItem.updateOne({_id:line.menuItemId},{$inc:{stockQuantity:line.quantity}},{session});order.status='cancelled';await order.save({session});});}finally{await session.endSession();}}else{order.status=next;await order.save();}res.json(order);};
""", "routes":[("get","/","list"),("post","/","create"),("patch","/:id/status","updateStatus")]},
"bus_booking": {
 "role":"customer", "resource":"trip", "tx":"booking", "resource_route":"/trips", "tx_route":"/bookings",
 "resource_fields":{"tripCode":"{ type: String, required: true, unique: true }","departureCity":"{ type: String, required: true }","destinationCity":"{ type: String, required: true }","departureTime":"{ type: Date, required: true }","arrivalTime":"{ type: Date, required: true }","ticketPrice":"{ type: Number, required: true }","totalSeats":"{ type: Number, required: true }","availableSeats":"{ type: Number, required: true }","status":"{ type: String, enum: ['scheduled','cancelled','departed'], default: 'scheduled' }"},
 "tx_fields":{"userId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }","tripId":"{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true }","numberOfTickets":"{ type: Number, required: true, min: 1 }","totalAmount":"{ type: Number, required: true }","bookingDate":"{ type: Date, default: Date.now }","status":"{ type: String, enum: ['confirmed','cancelled'], default: 'confirmed' }"},
 "controller":"""const Booking=require('../models/bookingModel');const Trip=require('../models/tripModel');
exports.list=async(req,res)=>{const q=req.user.role==='admin'?{}:{userId:req.user.userId};res.json(await Booking.find(q).populate('tripId'));};
exports.create=async(req,res)=>{const n=Number(req.body.numberOfTickets),trip=await Trip.findById(req.body.tripId);if(!trip)return res.status(404).json({message:'Trip not found'});if(trip.status!=='scheduled'||trip.departureTime<=new Date()||n<=0)return res.status(400).json({message:'Trip or ticket quantity is invalid'});if(n>trip.availableSeats)return res.status(400).json({message:'Not enough available seats'});trip.availableSeats-=n;await trip.save();res.status(201).json(await Booking.create({userId:req.user.userId,tripId:trip._id,numberOfTickets:n,totalAmount:n*trip.ticketPrice,status:'confirmed'}));};
exports.update=async(req,res)=>{const b=await Booking.findById(req.params.bookingId);if(!b)return res.status(404).json({message:'Booking not found'});if(b.status==='cancelled')return res.status(400).json({message:'Cancelled booking cannot be updated'});const n=Number(req.body.numberOfTickets);if(n<=0)return res.status(400).json({message:'numberOfTickets must be greater than 0'});const trip=await Trip.findById(b.tripId),difference=n-b.numberOfTickets;if(difference>trip.availableSeats)return res.status(400).json({message:'Not enough available seats'});trip.availableSeats-=difference;b.numberOfTickets=n;b.totalAmount=n*trip.ticketPrice;await trip.save();await b.save();res.json(b);};
exports.cancel=async(req,res)=>{const b=await Booking.findById(req.params.bookingId);if(!b)return res.status(404).json({message:'Booking not found'});if(b.status==='cancelled')return res.status(400).json({message:'Booking already cancelled'});const trip=await Trip.findById(b.tripId);trip.availableSeats+=b.numberOfTickets;b.status='cancelled';await trip.save();await b.save();res.json(b);};
""", "routes":[("get","/","list"),("post","/","create"),("put","/:bookingId","update"),("delete","/:bookingId","cancel")]}
}


def _route_code(domain):
    lines=["const router=require('express').Router();", "const controller=require('../controllers/%sController');"%domain["tx"], "const auth=require('../middlewares/authMiddleware');", "router.use(auth);"]
    lines += [f"router.{method}('{path}',controller.{handler});" for method,path,handler in domain["routes"]]
    return "\n".join(lines)+"\nmodule.exports=router;\n"


def generate_semantic_exam_project(config, dry_run=False):
    key=config.get("recognized_domain"); d=DOMAIN.get(key)
    if not d: return None, f"Unsupported semantic domain: {key}", []
    user_fields=dict(USER_FIELDS); user_fields["role"]=f"{{ type: String, enum: ['admin','{d['role']}'], default: '{d['role']}' }}"
    user_fields.update(d.get("user_fields", {}))
    if d.get("balance"): user_fields["balance"]="{ type: Number, default: 100000 }"
    resource_class=d["resource"][:1].upper()+d["resource"][1:]; tx_class=d["tx"][:1].upper()+d["tx"][1:]
    extra_user="".join(f", {name}:req.body.{name}" for name in d.get("user_fields",{}))
    auth=AUTH_CONTROLLER.replace("__DEFAULT_ROLE__",d["role"]).replace("__BALANCE__",", balance:100000" if d.get("balance") else "").replace("__EXTRA_USER__",extra_user)
    files={
      "package.json":json.dumps({"name":config["project_name"].lower(),**PACKAGE},indent=2), ".env.example":"MONGODB_URI=mongodb://127.0.0.1:27017/%s\nJWT_SECRET=change-me\nPORT=9999\n"%config["db_name"],
      "models/userModel.js":_model("User",user_fields), f"models/{d['resource']}Model.js":_model(resource_class,d["resource_fields"]), f"models/{d['tx']}Model.js":_model(tx_class,d["tx_fields"]),
      "controllers/authController.js":auth, f"controllers/{d['resource']}Controller.js":RESOURCE_CONTROLLER.replace("__RESOURCE__",d["resource"]), f"controllers/{d['tx']}Controller.js":d["controller"],
      "middlewares/authMiddleware.js":AUTH_MIDDLEWARE,
      "routes/authRoutes.js":"const r=require('express').Router(),c=require('../controllers/authController');r.post('/register',c.register);r.post('/login',c.login);module.exports=r;\n",
      f"routes/{d['resource']}Routes.js":f"const r=require('express').Router(),c=require('../controllers/{d['resource']}Controller'),auth=require('../middlewares/authMiddleware');r.get('/',c.list);r.post('/',auth,c.create);module.exports=r;\n",
      f"routes/{d['tx']}Routes.js":_route_code(d),
      "README.md":f"# {config['project_name']}\n\nOffline-generated SDN302 MCR backend.\n\n## Run\n\n```bash\nnpm install\ncopy .env.example .env\nnpm start\n```\n\nAuth: `POST /auth/register`, `POST /auth/login`. Business APIs: `{d['tx_route']}`. Example roles: admin and {d['role']}. Use Bearer JWT for protected routes.\n",
      "GENERATION_REPORT.md":f"# Generation report\n\n- Semantic family: `{key}`\n- Resource: `{resource_class}`\n- Transaction: `{tx_class}`\n- Business invariants compiled from an offline verified family.\n",
    }
    files["server.js"]="""require('dotenv').config();const express=require('express'),mongoose=require('mongoose');const app=express();app.use(express.json());mongoose.connect(process.env.MONGODB_URI||'mongodb://127.0.0.1:27017/__DB__');app.use('/auth',require('./routes/authRoutes'));app.use('__RR__',require('./routes/__R__Routes'));app.use('__TR__',require('./routes/__T__Routes'));app.listen(process.env.PORT||9999);module.exports=app;\n""".replace("__DB__",config["db_name"]).replace("__RR__",d["resource_route"]).replace("__TR__",d["tx_route"]).replace("__R__",d["resource"]).replace("__T__",d["tx"])
    output=os.path.join(config["output_dir"],config["project_name"])
    if dry_run:return files,output,[f"Semantic offline compiler: {key}"]
    os.makedirs(output,exist_ok=True)
    for rel,content in files.items():
      path=os.path.join(output,rel);os.makedirs(os.path.dirname(path),exist_ok=True)
      with open(path,"w",encoding="utf-8") as fh:fh.write(content)
    return files,output,[f"Semantic offline compiler: {key}"]
