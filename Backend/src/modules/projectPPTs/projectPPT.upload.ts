import multer from "multer";
import path from "path";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const MAX_PPT_SIZE = 20 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_PPT_SIZE, files: 1 },
    fileFilter: (_req, file, callback) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (!MIME_BY_EXTENSION[extension] || MIME_BY_EXTENSION[extension] !== file.mimetype) {
            return callback(
                new AppError("Only valid .ppt or .pptx files are allowed", 400, ERROR_CODES.VALIDATION_ERROR),
            );
        }
        callback(null, true);
    },
});

export const uploadPPTFile = upload.single("ppt");
