const mongoose = require("mongoose");
const crypto = require("crypto");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "UserName Required"],
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    required: [true, "User Email Required"],
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  role: {
    type: String,
    enum: ["admin", "user"],
    default: "user",
  },
  photo: {
    type: String,
    // required: [true, "User Photo Required"],
  },
  password: {
    type: String,
    required: [true, "Password Required"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Password Required"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "passwords are not the same",
    },
  },
  dob:{
    type:String
  },
  status: {
    type: String,
    enum: ["Pending", "Rejected", "Approved"],
    default: "Pending",
  },

  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.checkPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return jwtTimeStamp < changedTimeStamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  // const resetToken = crypto.randomBytes(32).toString("hex");
  const otp = Math.floor(100000 + Math.random() * 900000);

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(otp.toString())
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return otp;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
