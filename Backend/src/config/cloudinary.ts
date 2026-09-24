import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import "dotenv/config.js"

cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME!, 
        api_key: process.env.API_KEY!, 
        api_secret: process.env.API_SECRET!
        });

type SupportedResourceType = "auto" | "image" | "video" | "raw";

const removeLocalFile = (localFilePath: string) => {
    if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
    }
};

export const uploadOnCloudinary = async (
    localFilePath: string,
    options: {
        resourceType?: SupportedResourceType;
        folder?: string;
        publicId?: string;
    } = {}
) => {
    try {
        if(!localFilePath) return null;

        const { resourceType = "auto", folder, publicId } = options;
        const uploadOptions: {
            resource_type: SupportedResourceType;
            folder?: string;
            public_id?: string;
        } = {
            resource_type: resourceType
        };

        if (folder) {
            uploadOptions.folder = folder;
        }

        if (publicId) {
            uploadOptions.public_id = publicId;
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            ...uploadOptions
        });

        removeLocalFile(localFilePath);

        console.log("File uploaded successfully ", response);
        return response;
    } catch (error) {
        removeLocalFile(localFilePath);
        console.log("error ", error);
        return null;
    }
}
