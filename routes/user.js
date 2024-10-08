const express = require("express");
const router = express.Router();
const User = require("../model/userSchema");

//All Get user
router.get("/", (req, res) => {
  User.find()
    .then((users) => {
      res.json({ success: true, data: users });
    })
    .catch((err) => {
      console.log(err);
      res.status(401).json({ success: false, errmsg: err });
      console.log(err);
    });
});

// Get user
router.get("/profile/:username", (req, res) => {
  const { username } = req.params;
  console.log(username);
  User.findOne({ username })
    .then((user) => {
      if (!user) {
        return res
          .status(404)
          .json({ success: false, errmsg: "User not found" });
      }
      
      res.json({ success: true, data: user });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({ success: false, errmsg: "Internal Server Error" });
    });
});

// Update profile
router.put("/profile/:username", async (req, res) => {
  const { username } = req.params; // Extracting username from request parameters

  try {
    if (!username) {
      // Checking if username is missing
      return res
        .status(400)
        .json({ success: false, message: "Username parameter is missing" });
    }

    // Finding and updating the user based on username
    const updatedUser = await User.findOneAndUpdate(
      { username }, // Query for finding the user by username
      {
        userdesc: req.body.userdesc,
        name: req.body.name,
        contact: req.body.contact,
      },
      { new: true } // Return the updated user after the update operation
    );

    if (!updatedUser) {
      // If user is not found, return 404
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // If user is successfully updated, return the updated user object
    res.json({ success: true, updatedUser });
  } catch (e) {
    console.error(e);
    // If any error occurs during the update operation, return 500
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;