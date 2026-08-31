import { IUser, UserDocument } from "./user.type";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema<IUser>(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            index: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
            min: [6, "Password must be of atleast 6 characters."],
            max: [15, "Password cannot exceed 15 characters."]
        },
        profilePhotoUrl: {
            type: String,
            default: null
        },
        profilePhotoPublicId: {
            type: String,
            default: null
        },
        role: {
            type: String,
            enum: ["student", "teacher", "admin"],
            default: "student"
        },
        phoneNo: {
            type: String,
            default: ""
        },
        // resetOTP: {
        //     type: String,
        //     default: ""
        // },
        // resetOTPExpiresAt: {
        //     type: Number,
        //     default: 0
        // }
    }, 
    {timestamps: true}
);

userSchema.pre("save", async function (next) {
     const user = this as UserDocument;
    if(!user.isModified("password"))
        return;
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
    } 
);

userSchema.methods.comparePassword = async function (this: UserDocument,
    password: string
): Promise<boolean> {
    return bcrypt.compare(password, this.password);
}

export default mongoose.model<IUser>("User", userSchema);
