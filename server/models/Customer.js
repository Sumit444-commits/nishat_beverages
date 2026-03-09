

import mongoose from "mongoose";

// const salesAssignmentHistorySchema = new mongoose.Schema({
//     salesmanId: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Salesman',
//         default: null
//     },
//     date: {
//         type: Date,
//         default: Date.now
//     }
// });

// Customer Schema
const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      unique: true,
    },
    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
    },
    salesmanId: {
      type: String,
      default: null,
    },
//     salesmanId: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: "Salesman",
//   default: null
// },
    totalBalance: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
    },
    totalBottlesPurchased: {
      type: Number,
      default: 0,
      min: [0, "Bottles purchased cannot be negative"],
    },
    deliveryFrequencyDays: {
      type: Number,
      default: 1,
      min: [1, "Delivery frequency must be at least 1 day"],
    },
    emptyBottlesHeld: {
      type: Number,
      default: 0,
      min: [0, "Empty bottles cannot be negative"],
    },
    lastEmptiesCollectionDate: {
      type: Date,
      default: null,
    },
    // salesmanAssignmentHistory: [salesAssignmentHistorySchema],
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);
// // Indexes for faster queries
// customerSchema.index({ area: 1 });
// customerSchema.index({ salesmanId: 1 });
// customerSchema.index({ mobile: 1 });
// customerSchema.index({ name: 'text', address: 'text', area: 'text' });
// customerSchema.index({ isActive: 1 });

// // Pre-save middleware to update assignment history
// customerSchema.pre('save', function(next) {
//     if (this.isModified('salesmanId') && this.salesmanId) {
//         this.salesmanAssignmentHistory.push({
//             salesmanId: this.salesmanId,
//             date: new Date()
//         });
//     }
//     next();
// });

// // Method to format customer for response
// customerSchema.methods.toJSON = function() {
//     const customer = this.toObject();
//     customer.id = customer._id;
//     return customer;
// };
export const Customer = mongoose.model("Customer", customerSchema);
