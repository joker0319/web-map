const cloudinary = require('cloudinary').v2;
const config = require('../config/config');

// 配置 Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET
});

// 上传图片到 Cloudinary
const uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'hiking-forum',
      resource_type: 'auto'
    });
    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary上传失败:', error);
    throw new Error('图片上传失败');
  }
};

// 删除 Cloudinary 上的图片
const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary删除失败:', error);
    throw new Error('图片删除失败');
  }
};

module.exports = {
  uploadImage,
  deleteImage
}; 