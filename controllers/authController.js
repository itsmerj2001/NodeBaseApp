const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");
const User = require("../models/userModel");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const sendEmail = require("../utils/email");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const signup = catchAsync(async (req, res, next) => {
  const passwordChangedAt = new Date();
  console.log(passwordChangedAt);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: passwordChangedAt,
  });

  const token = signToken(newUser._id);
  res.status(201).json({
    status: "success",
    token: token,
    data: {
      user: newUser,
    },
  });
});

const login = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError(`Email and Password Required`, 400));
  }

  const user = await User.findOne({ email }).select("+password");
  console.log(user);
  if (!user || !(await user.checkPassword(password))) {
    return next(new AppError("Incorrect Email or Password", 401));
  }

  if (user.status === "Pending")
    return next(
      new AppError(
        "You can use the app once the admin approves your account.",
        400
      )
    );

  if (user.status === "Rejected")
    return next(
      new AppError(
        "Your account has been rejected. Please contact support.",
        400
      )
    );

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
    userRole: user.role,
  });
});

const protect = catchAsync(async (req, res, next) => {
 
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
   
  }
  if (!token) {
    return next(new AppError("Token Not Found", 401));
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  console.log(decoded,"decoded");

  const freshUser = await User.findById(decoded.id);

  if (!freshUser) {
    return next(
      new AppError("the user belongs to this id is no longer Exist", 401)
    );
  }
  if (await freshUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password ! Please login again", 401)
    );
  }

  req.user = freshUser;
  next();
});

const restrictTo = (...role) => {
  return (req, res, next) => {
    if (!role.includes(req.user.role)) {
      return next(new AppError("You are not allow to do this action", 401));
    }
    next();
  };
};

const forgotPassword = catchAsync(async (req, res, next) => {
  if (req.body.verified) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.body.otp)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError("Token is Invalid or Expired", 400));
    }

    res.status(200).json({
      status: "success",
      user: user._id,
    });
  } else {
    if (!req.body.email) {
      return next(new AppError("Kindly Give the email ID", 400));
    }
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new AppError("There is no user with the Email Address", 404));
    }

    const resetToken = user.createPasswordResetToken();
    user.save({ validateBeforeSave: false });

    const message = `Hello Ths is Your OTP:${resetToken}`;

    const subject = "Your Password Reset token valid for 10 Mins";
    try {
      await sendEmail({
        email: "mailtestnode@mailinator.com",
        subject,
        message,
      });

      res.status(200).json({
        status: "success",
        message: "token sent to Email",
      });
    } catch (err) {
      console.log(err);
      user.passwordResetToken = undefined;
      user.passwordtResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(
        new AppError(
          "THere was an Error sending the Email, Try again Later",
          500
        )
      );
    }
  }
});

const resetPassword = catchAsync(async (req, res, next) => {
  const userId = req.body.userId;
  console.log(req.body);
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("No User Found", 400));
  }

  if (!req.body.password || !req.body.confirmPassword) {
    return next(
      new AppError(
        "Password and Confirm Password Required to change the Password",
        400
      )
    );
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

const updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  console.log(req.body);

  if (
    !req.body.password ||
    !req.body.newPassword ||
    !req.body.confirmNewPassword
  ) {
    return next(
      new AppError("password, newPassword and Confirm new Password required"),
      400
    );
  }

  if (!(await user.checkPassword(req.body.password))) {
    return next(new AppError("old Password Incorrect", 401));
  }

  user.password = req.body.newPassword;
  user.passwordConfirm = req.body.confirmNewPassword;
  await user.save();

  const token = signToken(user._id);
  res.status(200).json({
    status: "success",
    token,
  });
});

module.exports = {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
};
