import { randomUUID } from "node:crypto";
import { extname } from "node:path";
import { cloudinary } from "../../config/cloudinary";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

export function uploadPPTToCloudinary(buffer: Buffer, fileName: string) {
    const extension = extname(fileName).toLowerCase();
    const publicId = `project-ppts/${randomUUID()}${extension}`;

    return new Promise<{ publicId: string; secureUrl: string }>((resolve, reject) => {
        const uploadFailed = () => {
            reject(new AppError("PPT upload failed", 502, ERROR_CODES.FILE_UPLOAD_FAILED));
        };
        const stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", public_id: publicId, overwrite: false },
            (error, result) => {
                if (error || !result?.secure_url || !result.public_id) {
                    uploadFailed();
                    return;
                }
                resolve({ publicId: result.public_id, secureUrl: result.secure_url });
            },
        );
        stream.once("error", uploadFailed);
        stream.end(buffer);
    });
}

export async function deletePPTFromCloudinary(publicId: string) {
    const { result } = await cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
        invalidate: true,
    });
    if (result !== "ok" && result !== "not found") {
        throw new Error("Cloudinary could not remove the PPT");
    }
}
