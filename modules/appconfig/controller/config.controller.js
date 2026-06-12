const configRepo = require('../repository/config.repository');

exports.getConfig = async (req, res) => {
  try {
    const config = await configRepo.getSingleton();

    res.json({
      success: true,
      data: config,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateThreshold = async (req, res) => {
  try {
    const { alertThreshold } = req.body;

    if (alertThreshold === undefined) {
      return res.status(400).json({
        success: false,
        message: "alertThreshold is required",
      });
    }

    const config = await configRepo.updateThreshold(alertThreshold);

    res.json({
      success: true,
      message: "Threshold updated successfully",
      data: config,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};