
import mongoose from "mongoose";
// Salesman Schema
const salesmanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Salesman name is required'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  mobile: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    unique: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  hireDate: {
    type: Date,
    default: Date.now
  },
  monthlySalary: {
    type: Number,
    default: 0,
    min: [0, 'Salary cannot be negative']
  },
  areasAssigned: [{
    type: String,
    trim: true
  }],
  customersAssigned: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalCommission: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});
// // Indexes for faster queries
// salesmanSchema.index({ name: 'text' });
// salesmanSchema.index({ mobile: 1 });
// salesmanSchema.index({ isActive: 1 });
// salesmanSchema.index({ hireDate: -1 });

// // Method to format salesman for response
// salesmanSchema.methods.toJSON = function() {
//     const salesman = this.toObject();
//     salesman.id = salesman._id;
//     return salesman;
// };
export const Salesman = mongoose.model('Salesman', salesmanSchema);
