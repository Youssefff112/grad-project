import path from 'path';
import { AppError } from '../Utils/appError.utils.js';
import { deleteFile } from '../Utils/fileUpload.js';
import {
  collectUploadedFiles,
  isValidImageFile,
  uploadedFilePath,
} from '../Utils/imageMagicBytes.utils.js';

/** Reject uploads whose content does not match known image signatures. */
export const validateUploadedImages = (req, res, next) => {
  const files = collectUploadedFiles(req);
  if (!files.length) return next();

  for (const file of files) {
    const filePath = uploadedFilePath(file);
    if (!filePath || !isValidImageFile(filePath)) {
      for (const f of files) {
        const p = uploadedFilePath(f);
        if (p) deleteFile(f.filename || path.basename(p));
      }
      return next(new AppError('Invalid image file. Upload a JPEG, PNG, GIF, WebP, or HEIC image.', 400));
    }
  }

  return next();
};
