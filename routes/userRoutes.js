const {
  getAllUsers,
  addUser,
  getUser,
  updateUser,
  deleteUser,
  updateMe,
  deleteMe,
  fetchDetails,
} = require("./../controllers/userController");

const {
  signup,
  login,
  protect,
  restrictTo,
  forgotPassword,
  resetPassword,
  updatePassword,
} = require("../controllers/authController");

const express = require("express");

const router = express.Router();

// Auth
router.post("/signup", signup);
router.post("/login", login);
router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword", resetPassword);
router.patch("/updatePassword", protect, updatePassword);

//  user activities
router.patch("/updateMe", protect, updateMe);
router.get('/fetchDetails',protect, fetchDetails);
router.delete("/deleteMe", protect, deleteMe);

// admin User activities
// router.route("/").get(getAllUsers);
router.route("/").get(protect, restrictTo("admin"),getAllUsers).post(addUser);

router
  .route("/:id").all(protect, restrictTo("admin"))
  .get(getUser)
  .patch(updateUser)
  .delete( deleteUser);

module.exports = router;
