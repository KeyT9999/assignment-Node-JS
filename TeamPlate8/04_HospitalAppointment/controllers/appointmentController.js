const mongoose = require('mongoose');
const Appointment = require('../models/appointmentModel');
const Doctor = require('../models/doctorModel');
exports.list = async (_req, res) => {
  try {
    const data = await Appointment.find().populate('doctorId', 'fullName specialty consultationFee');
    res.status(200).json(data)
  } catch (e) {
    res.status(500).json({
      message: e.message
    })
  }
};
exports.book = async (req, res) => {
  try {
    const {
      doctorId,
      patientName,
      appointmentTime,
      note
    }
 = req.body;
    const time = new Date(appointmentTime);
    if (!mongoose.isValidObjectId(doctorId) || !patientName || Number.isNaN(time.getTime()))return res.status(400).json({
      message: 'doctorId, patientName and a valid appointmentTime are required'
    });
    if (time <= new Date())return res.status(400).json({
      message: 'appointmentTime must not be in the past'
    });
    const doctor = await Doctor.findById(doctorId);
    if (!doctor)return res.status(404).json({
      message: 'Doctor not found'
    });
    if (doctor.status !== 'available')return res.status(400).json({
      message: 'This doctor is currently unavailable.'
    });
    if (await Appointment.exists({
      doctorId,
      appointmentTime: time,
      completedAt: null
    }))return res.status(409).json({
      message: 'This doctor already has an appointment at the requested time.'
    });
    const appointment = await Appointment.create({
      patientId: process.env.FIXED_PATIENT_ID || '000000000000000000000001',
      doctorId,
      patientName,
      appointmentTime: time,
      note
    });
    res.status(201).json(appointment)
  } catch (e) {
    if (e.code === 11000)return res.status(409).json({
      message: 'This doctor already has an appointment at the requested time.'
    });
    res.status(500).json({
      message: e.message
    })
  }
};
exports.complete = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('doctorId', 'consultationFee fullName specialty');
    if (!appointment)return res.status(404).json({
      message: 'Appointment not found'
    });
    if (appointment.completedAt)return res.status(400).json({
      message: 'This appointment has already been completed.'
    });
    appointment.completedAt = new Date();
    appointment.totalFee = appointment.doctorId.consultationFee;
    await appointment.save();
    res.status(200).json(appointment)
  } catch (e) {
    if (e.name === 'CastError')return res.status(404).json({
      message: 'Appointment not found'
    });
    res.status(500).json({
      message: e.message
    })
  }
};
