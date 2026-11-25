import mongoose from "mongoose";
import projectPPTModel from "./projectPPT.model";
import projectApplicationModel from "../projectApplications/projectApplication.model";
import projectModel from "../projects/project.model";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";
import type { IProjectPPTVersion, ProjectPPTDocument } from "./projectPPT.type";
import { deletePPTFromCloudinary, uploadPPTToCloudinary } from "./projectPPT.cloudinary";
import type { Express } from "express";

type UploadInput = { applicationId?: string };

type ReviewInput = {
    approved?: boolean;
    comment?: string;
    rejectionReason?: string;
};

function fail(message: string, status: number, code: string): never {
    throw new AppError(message, status, code);
}

const MAX_PPT_SIZE = 20 * 1024 * 1024;
const ALLOWED_MIME_TYPES = [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

class ProjectPPTService {
    private validateUpload(file?: Express.Multer.File) {
        if (!file) fail("PPT file is required in the 'ppt' form-data field", 400, ERROR_CODES.VALIDATION_ERROR);
        const fileName = file.originalname?.trim();
        const mimeType = file.mimetype?.trim();
        const fileSize = file.size;
        if (!fileName || !/\.(ppt|pptx)$/i.test(fileName))
            fail("Only .ppt and .pptx files are allowed", 400, ERROR_CODES.VALIDATION_ERROR);
        if (!ALLOWED_MIME_TYPES.includes(mimeType))
            fail("Unsupported PPT file type", 400, ERROR_CODES.VALIDATION_ERROR);
        if (!Number.isInteger(fileSize) || fileSize <= 0 || fileSize > MAX_PPT_SIZE)
            fail("PPT file size must be greater than 0 and at most 20 MB", 400, ERROR_CODES.VALIDATION_ERROR);

        // Check the file signature as well as the browser-supplied MIME type.
        const isPptx = /\.pptx$/i.test(fileName);
        const hasZipSignature = file.buffer.length >= 4 && file.buffer[0] === 0x50 && file.buffer[1] === 0x4b;
        const hasOleSignature = file.buffer.length >= 8 &&
            file.buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
        if ((isPptx && !hasZipSignature) || (!isPptx && !hasOleSignature))
            fail("The uploaded file content does not match a PowerPoint file", 400, ERROR_CODES.VALIDATION_ERROR);
        return { fileName, mimeType, fileSize, buffer: file.buffer };
    }

    private latestVersion(ppt: ProjectPPTDocument) {
        const version = ppt.versions.find(
            (item) => item.versionNumber === ppt.latestVersionNumber,
        );
        if (!version) fail("Latest PPT version was not found", 500, ERROR_CODES.INTERNAL_SERVER_ERROR);
        return version;
    }

    private populate(query: any) {
        return query
            .populate("applicationId")
            .populate("projectId")
            .populate("studentId", "name email phoneNo department")
            .populate("mentorId", "name email phoneNo department")
            .populate({
                path: "teamId",
                populate: [
                    { path: "leaderId", select: "name email phoneNo department" },
                    { path: "memberIds", select: "name email phoneNo department" },
                ],
            })
            .populate("versions.uploadedBy", "name email")
            .populate("versions.mentorReview.reviewerId", "name email")
            .populate("versions.coordinatorReview.reviewerId", "name email");
    }

    async submitOrRevise(studentId: string, data: UploadInput, uploadedFile?: Express.Multer.File) {
        if (!mongoose.isValidObjectId(studentId))
            fail("Invalid authenticated user id", 401, ERROR_CODES.UNAUTHORIZED);
        const applicationId = data?.applicationId;
        if (typeof applicationId !== "string" || !mongoose.isValidObjectId(applicationId))
            fail("Valid applicationId is required", 400, ERROR_CODES.VALIDATION_ERROR);

        const { buffer, ...file } = this.validateUpload(uploadedFile);
        const application = await projectApplicationModel.findById(applicationId);
        if (!application) fail("Project application not found", 404, ERROR_CODES.NOT_FOUND);
        if (application.studentId.toString() !== studentId)
            fail("Only the team leader who submitted the application can upload its PPT", 403, ERROR_CODES.FORBIDDEN);
        if (application.status !== "APPROVED")
            fail("PPT can be submitted only after final admin approval of the project proposal", 409, ERROR_CODES.VALIDATION_ERROR);
        const { projectId, mentorId } = application;
        if (!projectId || !mentorId)
            fail("Approved application is missing project or mentor information", 409, ERROR_CODES.VALIDATION_ERROR);

        const existing = await projectPPTModel.findOne({ applicationId: application._id });
        if (existing && existing.status !== "REVISION_REQUIRED")
            fail("A new PPT version can be uploaded only after mentor requests a revision", 409, ERROR_CODES.VALIDATION_ERROR);

        const cloudFile = await uploadPPTToCloudinary(buffer, file.fileName);
        const versionFile = { ...file, fileUrl: cloudFile.secureUrl, cloudinaryPublicId: cloudFile.publicId };
        try {
            if (!existing) {
                const version: IProjectPPTVersion = {
                    versionNumber: 1,
                    ...versionFile,
                    uploadedBy: new mongoose.Types.ObjectId(studentId),
                    uploadedAt: new Date(),
                    mentorReview: { decision: "PENDING" },
                    coordinatorReview: { decision: "PENDING" },
                };
                const created = await projectPPTModel.create({
                    applicationId: application._id,
                    projectId,
                    teamId: application.teamId,
                    studentId: application.studentId,
                    mentorId,
                    status: "PENDING_MENTOR_REVIEW",
                    latestVersionNumber: 1,
                    versions: [version],
                });
                return this.populate(projectPPTModel.findById(created._id));
            }

            const nextVersion = existing.latestVersionNumber + 1;
            existing.versions.push({
                versionNumber: nextVersion,
                ...versionFile,
                uploadedBy: new mongoose.Types.ObjectId(studentId),
                uploadedAt: new Date(),
                mentorReview: { decision: "PENDING" },
                coordinatorReview: { decision: "PENDING" },
            } as IProjectPPTVersion);
            existing.latestVersionNumber = nextVersion;
            existing.status = "PENDING_MENTOR_REVIEW";
            await existing.save();
            return this.populate(projectPPTModel.findById(existing._id));
        } catch (error) {
            // If MongoDB persistence fails, remove the just-uploaded orphan from Cloudinary.
            try { await deletePPTFromCloudinary(cloudFile.publicId); } catch (cleanupError) {
                console.error("Failed to clean up orphaned PPT in Cloudinary:", cleanupError);
            }
            throw error;
        }
    }

    async getMyPPTs(studentId: string) {
        return this.populate(projectPPTModel.find({ studentId }).sort({ updatedAt: -1 }));
    }

    async getMentorQueue(mentorId: string) {
        return this.populate(
            projectPPTModel.find({
                mentorId,
                status: "PENDING_MENTOR_REVIEW",
            }).sort({ updatedAt: 1 }),
        );
    }

    async getCoordinatorQueue() {
        return this.populate(
            projectPPTModel.find({ status: "PENDING_COORDINATOR_REVIEW" }).sort({ updatedAt: 1 }),
        );
    }

    async getAdminApprovedPPTs() {
        // Admin can only see the final approved version, not the revision history.
        const records: any[] = await this.populate(
            projectPPTModel.find({ status: "APPROVED" }).sort({ updatedAt: -1 }),
        );
        return records.map((record) => {
            const finalVersion = record.versions.find(
                (item: any) => item.versionNumber === record.latestVersionNumber,
            );
            record.versions = finalVersion ? [finalVersion] : [];
            return record;
        });
    }

    async getById(pptId: string, userId: string, role?: string) {
        if (!mongoose.isValidObjectId(pptId))
            fail("Invalid PPT id", 400, ERROR_CODES.VALIDATION_ERROR);
        const ppt = await this.populate(projectPPTModel.findById(pptId));
        if (!ppt) fail("PPT submission not found", 404, ERROR_CODES.NOT_FOUND);

        const record: any = ppt;
        const isStudent = record.studentId?._id?.toString() === userId;
        const isMentor = record.mentorId?._id?.toString() === userId;
        const isCoordinator = role === "lab_coordinator";
        const isAdminFinal = role === "admin" && record.status === "APPROVED";
        if (!isStudent && !isMentor && !isCoordinator && !isAdminFinal)
            fail("You are not allowed to view this PPT submission", 403, ERROR_CODES.FORBIDDEN);
        if (role === "admin" && !isAdminFinal)
            fail("Admin can only view finally approved PPT submissions", 403, ERROR_CODES.FORBIDDEN);
        if (role === "admin") {
            const finalVersion = record.versions.find(
                (item: any) => item.versionNumber === record.latestVersionNumber,
            );
            record.versions = finalVersion ? [finalVersion] : [];
        }
        return ppt;
    }

    async mentorReview(pptId: string, mentorId: string, input: ReviewInput) {
        if (!mongoose.isValidObjectId(pptId))
            fail("Invalid PPT id", 400, ERROR_CODES.VALIDATION_ERROR);
        const approved = input.approved === true;
        if (input.approved !== true && input.approved !== false)
            fail("approved must be true or false", 400, ERROR_CODES.VALIDATION_ERROR);
        const ppt = await projectPPTModel.findById(pptId);
        if (!ppt) fail("PPT submission not found", 404, ERROR_CODES.NOT_FOUND);
        if (ppt.mentorId.toString() !== mentorId)
            fail("Only the assigned mentor can review this PPT", 403, ERROR_CODES.FORBIDDEN);
        if (ppt.status !== "PENDING_MENTOR_REVIEW")
            fail("PPT is not awaiting mentor review", 409, ERROR_CODES.VALIDATION_ERROR);

        const version = this.latestVersion(ppt);
        const comment = (input.rejectionReason || input.comment || "").trim();
        if (!approved && !comment)
            fail("Mentor must provide remarks when requesting a revision", 400, ERROR_CODES.VALIDATION_ERROR);

        version.mentorReview = {
            decision: approved ? "APPROVED" : "REJECTED",
            reviewerId: new mongoose.Types.ObjectId(mentorId),
            comment,
            reviewedAt: new Date(),
        };
        ppt.status = approved ? "PENDING_COORDINATOR_REVIEW" : "REVISION_REQUIRED";
        await ppt.save();
        return this.populate(projectPPTModel.findById(ppt._id));
    }

    async coordinatorReview(pptId: string, coordinatorId: string, input: ReviewInput) {
        if (!mongoose.isValidObjectId(pptId))
            fail("Invalid PPT id", 400, ERROR_CODES.VALIDATION_ERROR);
        if (input.approved !== true && input.approved !== false)
            fail("approved must be true or false", 400, ERROR_CODES.VALIDATION_ERROR);

        const session = await mongoose.startSession();
        try {
            const reviewedId = await session.withTransaction(async () => {
                const ppt = await projectPPTModel.findById(pptId).session(session);
                if (!ppt) fail("PPT submission not found", 404, ERROR_CODES.NOT_FOUND);
                if (ppt.status !== "PENDING_COORDINATOR_REVIEW")
                    fail("PPT is not awaiting coordinator review", 409, ERROR_CODES.VALIDATION_ERROR);

                const version = this.latestVersion(ppt);
                if (version.mentorReview?.decision !== "APPROVED")
                    fail("The latest PPT version must be approved by the mentor first", 409, ERROR_CODES.VALIDATION_ERROR);

                const comment = (input.rejectionReason || input.comment || "").trim();
                if (input.approved === false && !comment)
                    fail("Coordinator must provide a rejection reason", 400, ERROR_CODES.VALIDATION_ERROR);

                version.coordinatorReview = {
                    decision: input.approved ? "APPROVED" : "REJECTED",
                    reviewerId: new mongoose.Types.ObjectId(coordinatorId),
                    comment,
                    reviewedAt: new Date(),
                };

                const application = await projectApplicationModel.findById(ppt.applicationId).session(session);
                if (!application) fail("Related project application not found", 404, ERROR_CODES.NOT_FOUND);
                if (application.status !== "APPROVED")
                    fail("Related project application is no longer approved", 409, ERROR_CODES.VALIDATION_ERROR);

                if (input.approved) {
                    const project = await projectModel.findOneAndUpdate(
                        { _id: ppt.projectId, visibilityStatus: "RESERVED" },
                        { $set: { visibilityStatus: "ALLOCATED" } },
                        { new: true, session },
                    );
                    if (!project)
                        fail("Project could not be marked as completely allocated", 409, ERROR_CODES.PROJECT_NOT_AVAILABLE);
                    ppt.status = "APPROVED";
                } else {
                    application.status = "REJECTED";
                    application.rejectionReason = `PPT rejected by Lab Coordinator: ${comment}`;
                    await application.save({ session });

                    if (application.source === "OWN_IDEA") {
                        await projectModel.updateOne(
                            { _id: ppt.projectId, visibilityStatus: "RESERVED" },
                            { $set: { visibilityStatus: "HIDDEN" } },
                            { session },
                        );
                    } else {
                        await projectModel.updateOne(
                            { _id: ppt.projectId, visibilityStatus: "RESERVED" },
                            { $set: { visibilityStatus: "AVAILABLE" } },
                            { session },
                        );
                    }
                    ppt.status = "REJECTED_BY_COORDINATOR";
                }
                await ppt.save({ session });
                return ppt._id;
            });
            return this.populate(projectPPTModel.findById(reviewedId));
        } finally {
            await session.endSession();
        }
    }
}

export = new ProjectPPTService();
