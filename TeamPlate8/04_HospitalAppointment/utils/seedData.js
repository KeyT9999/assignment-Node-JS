require('dotenv').config();
const mongoose = require('mongoose'), connectDB = require('../config/db'), Doctor = require('../models/doctorModel'), Appointment = require('../models/appointmentModel');
(async () => {
  try {
    await connectDB();
    await Appointment.deleteMany();
    await Doctor.deleteMany();
    const doctors = await Doctor.create([{
      doctorCode: 'DOC001',
      fullName: 'Dr. Nguyen Minh Anh',
      specialty: 'Cardiology',
      status: 'available',
      consultationFee: 500000
    }, {
      doctorCode: 'DOC002',
      fullName: 'Dr. Tran Thu Ha',
      specialty: 'Dermatology',
      status: 'on_leave',
      consultationFee: 350000
    }, {
      doctorCode: 'DOC003',
      fullName: 'Dr. Le Quang Huy',
      specialty: 'Pediatrics',
      status: 'available',
      consultationFee: 400000
    }]);
    console.log('Hospital seed completed');
    doctors.forEach(d => console.log(`${d.doctorCode}: ${d._id}`))
  } catch (e) {
    console.error(e);
    process.exitCode = 1
  } finally {
    await mongoose.connection.close()
  }
})();
