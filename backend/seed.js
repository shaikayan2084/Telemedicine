require('dotenv').config();
const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');

const doctors = [
  { firstName: 'Raj', lastName: 'Sharma', email: 'raj.sharma@telemed.com', password: 'Test@1234', specialty: 'cardiologist', licenseNumber: 'LIC-001', phone: '+91-9876543210', yearsOfExperience: 12, qualifications: ['MD', 'DM Cardiology'], bio: 'Senior cardiologist specializing in interventional cardiology.' },
  { firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@telemed.com', password: 'Test@1234', specialty: 'neurologist', licenseNumber: 'LIC-002', phone: '+91-9876543211', yearsOfExperience: 10, qualifications: ['MD', 'DM Neurology'], bio: 'Expert in stroke management and neurological disorders.' },
  { firstName: 'Sunil', lastName: 'Verma', email: 'sunil.verma@telemed.com', password: 'Test@1234', specialty: 'orthopedic', licenseNumber: 'LIC-003', phone: '+91-9876543212', yearsOfExperience: 15, qualifications: ['MS Ortho'], bio: 'Joint replacement and sports injury specialist.' },
  { firstName: 'Anita', lastName: 'Desai', email: 'anita.desai@telemed.com', password: 'Test@1234', specialty: 'pediatrician', licenseNumber: 'LIC-004', phone: '+91-9876543213', yearsOfExperience: 8, qualifications: ['MD Pediatrics'], bio: 'Child health and development expert.' },
  { firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@telemed.com', password: 'Test@1234', specialty: 'dermatologist', licenseNumber: 'LIC-005', phone: '+91-9876543214', yearsOfExperience: 9, qualifications: ['MD', 'DVD'], bio: 'Skin, hair, and nail disorders specialist.' },
  { firstName: 'Meera', lastName: 'Reddy', email: 'meera.reddy@telemed.com', password: 'Test@1234', specialty: 'gynecologist', licenseNumber: 'LIC-006', phone: '+91-9876543215', yearsOfExperience: 14, qualifications: ['MD', 'DNB'], bio: 'Women\'s health and obstetrics specialist.' },
  { firstName: 'Arjun', lastName: 'Nair', email: 'arjun.nair@telemed.com', password: 'Test@1234', specialty: 'ophthalmologist', licenseNumber: 'LIC-007', phone: '+91-9876543216', yearsOfExperience: 11, qualifications: ['MS Ophthalmology'], bio: 'Cataract and LASIK surgery specialist.' },
  { firstName: 'Kavita', lastName: 'Joshi', email: 'kavita.joshi@telemed.com', password: 'Test@1234', specialty: 'psychiatrist', licenseNumber: 'LIC-008', phone: '+91-9876543217', yearsOfExperience: 7, qualifications: ['MD Psychiatry'], bio: 'Mental health and counseling expert.' },
  { firstName: 'Rohan', lastName: 'Gupta', email: 'rohan.gupta@telemed.com', password: 'Test@1234', specialty: 'gastroenterologist', licenseNumber: 'LIC-009', phone: '+91-9876543218', yearsOfExperience: 13, qualifications: ['MD', 'DM Gastroenterology'], bio: 'Digestive system and liver disease specialist.' },
  { firstName: 'Deepa', lastName: 'Iyer', email: 'deepa.iyer@telemed.com', password: 'Test@1234', specialty: 'endocrinologist', licenseNumber: 'LIC-010', phone: '+91-9876543219', yearsOfExperience: 10, qualifications: ['MD', 'DM Endocrinology'], bio: 'Diabetes and hormone disorders specialist.' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let count = 0;
    for (const docData of doctors) {
      const exists = await Doctor.findOne({ email: docData.email });
      if (!exists) {
        await Doctor.create(docData);
        count++;
        console.log(`  Created: Dr. ${docData.firstName} ${docData.lastName} (${docData.specialty})`);
      } else {
        console.log(`  Exists: Dr. ${docData.firstName} ${docData.lastName}`);
      }
    }

    console.log(`\nDone. ${count} new doctors added.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
