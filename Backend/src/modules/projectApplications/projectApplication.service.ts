import mongoose from "mongoose";
import projectApplicationModel from "./projectApplication.model";
import projectModel from "../projects/project.model";

import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

class ProjectApplicationService {


    // CREATE OWN IDEA
  

    async submitOwnIdea(
        studentId: string,
        data: any
    ) {

        const existingApplication =
            await projectApplicationModel.findOne({
                studentId,
                source: "OWN_IDEA",
                status: {
                    $nin: ["REJECTED"]
                }
            });

        if (existingApplication) {
            throw new AppError(
                "You already have an active project application",
                400,
                ERROR_CODES.VALIDATION_ERROR
            );
        }


        const application =
            await projectApplicationModel.create({

                studentId,

                projectId: null,

                source: "OWN_IDEA",

                mobileNumber: data.mobileNumber,

                projectDetails: {
                    title: data.title,
                    description: data.description,
                    domain: data.domain,
                    sdgGoals: data.sdgGoals,
                    technologyStack: data.technologyStack,
                    expectedOutcome: data.expectedOutcome
                },

                teamMembers: data.teamMembers || [],

                mentorId: null,

                facultyId: null,

                status: "ADMIN_REVIEW"
            });


        return application;
    }


    
    // APPLY TO FACULTY PROJECT
     

    async applyFacultyProject(
        studentId: string,
        data: any
    ) {

        const session =
            await mongoose.startSession();

        try {

            session.startTransaction();


            const project =
                await projectModel.findOneAndUpdate(
                    {
                        _id: data.projectId,
                        source: "FACULTY_PROJECT",
                        visibilityStatus: "AVAILABLE"
                    },
                    {
                        visibilityStatus: "RESERVED"
                    },
                    {
                        new: true,
                        session
                    }
                );


            if (!project) {

                throw new AppError(
                    "Project is no longer available",
                    409,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }


            if (data.teamMembers?.length > 3) {

                throw new AppError(
                    "Maximum 3 additional team members are allowed",
                    400,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }


            const application =
                await projectApplicationModel.create(
                    [{
                        studentId,

                        projectId: project._id,

                        source: "FACULTY_PROJECT",

                        mobileNumber: data.mobileNumber,

                        teamMembers:
                            data.teamMembers || [],

                        mentorId:
                            project.facultyId,

                        facultyId:
                            project.facultyId,

                        status: "MENTOR_REVIEW"
                    }],
                    {
                        session
                    }
                );


            await session.commitTransaction();

            return application[0];

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            await session.endSession();

        }
    }


    
    // APPLY TO PROJECT BANK
     

    async applyProjectBank(
        studentId: string,
        data: any
    ) {

        const session =
            await mongoose.startSession();

        try {

            session.startTransaction();


            const project =
                await projectModel.findOneAndUpdate(
                    {
                        _id: data.projectId,
                        source: "PROJECT_BANK",
                        visibilityStatus: "AVAILABLE"
                    },
                    {
                        visibilityStatus: "RESERVED"
                    },
                    {
                        new: true,
                        session
                    }
                );


            if (!project) {

                throw new AppError(
                    "Project is no longer available",
                    409,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }


            if (!data.mentorId) {

                throw new AppError(
                    "Mentor is required",
                    400,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }


            if (
                data.teamMembers &&
                data.teamMembers.length > 3
            ) {

                throw new AppError(
                    "Maximum 3 additional team members are allowed",
                    400,
                    ERROR_CODES.VALIDATION_ERROR
                );
            }


            const application =
                await projectApplicationModel.create(
                    [{
                        studentId,

                        projectId: project._id,

                        source: "PROJECT_BANK",

                        mobileNumber:
                            data.mobileNumber,

                        teamMembers:
                            data.teamMembers || [],

                        mentorId:
                            data.mentorId,

                        facultyId:
                            data.mentorId,

                        status: "FACULTY_REVIEW"
                    }],
                    {
                        session
                    }
                );


            await session.commitTransaction();

            return application[0];

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            await session.endSession();

        }
    }


    
    // GET MY APPLICATIONS


    async getMyApplications(
        studentId: string
    ) {

        return await projectApplicationModel
            .find({
                studentId
            })
            .populate(
                "projectId"
            )
            .populate(
                "mentorId",
                "name email"
            )
            .populate(
                "teamMembers",
                "name email"
            )
            .sort({
                createdAt: -1
            });
    }


    // ==========================================
    // GET APPLICATION BY ID
    // ==========================================

    async getApplicationById(
        applicationId: string
    ) {

        const application =
            await projectApplicationModel
                .findById(applicationId)
                .populate("studentId", "name email phoneNo")
                .populate("projectId")
                .populate("mentorId", "name email")
                .populate("facultyId", "name email")
                .populate("teamMembers", "name email");


        if (!application) {

            throw new AppError(
                "Application not found",
                404,
                ERROR_CODES.NOT_FOUND
            );
        }


        return application;
    }
}

export = new ProjectApplicationService();