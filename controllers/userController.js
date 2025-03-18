const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");

const filterObj = (obj, ...allowedFields) => {
  newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

//For User

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.user._id, { active: false });

  res.status(204).json({
    status: "success",
    data: null,
  });
});
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError("This Route is not for updating password", 400));
  }

  const filteredBody = filterObj(req.body, "name", "dob");
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const usersData = await User.find();

  console.log(usersData);
  res.status(200).json({
    status: "success",
    data: {
      users: usersData,
    },
  });
});

exports.fetchDetails = catchAsync(async (req,res,next)=>{
  console.log(req.user);
  if (!req.user.id) {
    return next(new AppError("UserId Required", 400));
  }
  const Id = req.user.id;
  const userDetails = await User.findById(Id);
  console.log(userDetails);
  res.status(200).json({
    status: "success",
    data: {
      user: userDetails,
    },
  });
} )

//For Admin
exports.addUser = (req, res) => {
  res.status(500).json({
    status: "error",
    Message: "Route is not yet defined",
  });
};

exports.getUser = catchAsync(async (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("UserId Required", 400));
  }
  const Id = req.params.id;
  const userDetails = await User.findById(Id);
  console.log(userDetails);
  res.status(200).json({
    status: "success",
    data: {
      user: userDetails,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  if (!req.params.id) {
    return next(new AppError("UserId Required", 400));
  }
  const Id = req.params.id;
  const userDetails = await User.findById(Id);
  console.log(userDetails);
  res.status(200).json({
    status: "success",
    data: {
      user: userDetails,
    },
  });
});

exports.updateUser = catchAsync(async (req, res) => {
  const userId = req.params.id;
  const filteredBody = filterObj(req.body, "status");
  console.log(filteredBody);
  const updatedUser = await User.findByIdAndUpdate(userId, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.status(404).json({
    status: "success",
    data: null,
  });
});
