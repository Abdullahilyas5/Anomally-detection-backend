const path = require('path');

class ReportStorageService {
  async publish(filePath) {
    if (process.env.REPORT_UPLOAD_PROVIDER === 'cloudinary') {
      return this.uploadToCloudinary(filePath);
    }

    return {
      provider: 'local',
      path: filePath,
    };
  }

  async uploadToCloudinary(filePath) {
    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      folder: process.env.REPORT_CLOUD_FOLDER || 'reports',
      public_id: path.basename(filePath, path.extname(filePath)),
    });

    return {
      provider: 'cloudinary',
      url: result.secure_url,
      publicId: result.public_id,
    };
  }
}

module.exports = new ReportStorageService();
