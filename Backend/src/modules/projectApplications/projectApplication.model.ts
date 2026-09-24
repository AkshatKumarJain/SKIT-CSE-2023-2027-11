import mongoose from "mongoose";
import { IProjectApplication } from "./projectApplication.type";

const projectApplicationSchema =
    new mongoose.Schema<IProjectApplication>(
        {
            studentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            projectId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Project",
                default: null
            },

            source: {
                type: String,
                enum: [
                    "OWN_IDEA",
                    "FACULTY_PROJECT",
                    "PROJECT_BANK"
                ],
                required: true
            },

            mobileNumber: {
                type: String,
                required: true,
                trim: true
            },

            projectDetails: {
                title: {
                    type: String
                },

                description: {
                    type: String
                },

                domain: {
                    type: String
                },

                sdgGoals: {
                    type: [String],
                    default: []
                },

                technologyStack: {
                    type: [String],
                    default: []
                },

                expectedOutcome: {
                    type: String
                }
            },

            teamMembers: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            ],

            mentorId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            },

            facultyId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                default: null
            },

            status: {
                type: String,
                enum: [
                    "ADMIN_REVIEW",
                    "ADMIN_APPROVED",
                    "MENTOR_REVIEW",
                    "MENTOR_APPROVED",
                    "FACULTY_REVIEW",
                    "FACULTY_APPROVED",
                    "ADMIN_FINAL_REVIEW",
                    "APPROVED",
                    "REJECTED"
                ],
                required: true
            },

            rejectionReason: {
                type: String,
                default: null
            },

            approvalHistory: [
                {
                    stage: {
                        type: String,
                        required: true
                    },

                    action: {
                        type: String,
                        required: true
                    },

                    approvedBy: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "User",
                        required: true
                    },

                    comment: {
                        type: String,
                        default: ""
                    },

                    actedAt: {
                        type: Date,
                        default: Date.now
                    }
                }
            ],

            submittedAt: {
                type: Date,
                default: Date.now
            },

            approvedAt: {
                type: Date,
                default: null
            }
        },
        {
            timestamps: true
        }
    );


// Useful indexes
projectApplicationSchema.index({
    studentId: 1
});

projectApplicationSchema.index({
    projectId: 1
});

projectApplicationSchema.index({
    status: 1
});

projectApplicationSchema.index({
    mentorId: 1
});


export default mongoose.model<IProjectApplication>(
    "ProjectApplication",
    projectApplicationSchema
);