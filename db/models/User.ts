import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "doctor", "patient"], default: "patient", required: true },
  photoUrl: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, enum: ["male", "female"], default: null },
  address: { type: String, default: null },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre("save", async function() {
  this.updatedAt = new Date();
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
