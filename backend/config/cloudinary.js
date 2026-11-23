import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

const hasCloudinary = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function uploadImageBuffer(buffer, mimetype, folder = 'parkgrid/lots') {
  if (!buffer) return null;

  if (hasCloudinary) {
    const base64 = `data:${mimetype};base64,${buffer.toString('base64')}`;
    const result = await cloudinary.uploader.upload(base64, {
      folder,
      resource_type: 'image',
      transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto' }],
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
      provider: 'cloudinary',
    };
  }

  // Safe data URL fallback when Cloudinary credentials are not configured
  const dataUrl = `data:${mimetype};base64,${buffer.toString('base64')}`;
  return {
    url: dataUrl,
    publicId: null,
    provider: 'inline',
  };
}
