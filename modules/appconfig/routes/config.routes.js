const express = require("express");
const router = express.Router();

const {
  getConfig,
  updateThreshold,
} = require("../controller/config.controller");

// public or authenticated (your choice)
router.get("/", getConfig);

// admin only
router.put("/threshold", updateThreshold);

module.exports = router;