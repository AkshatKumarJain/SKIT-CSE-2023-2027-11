import express from "express";

import projectApplicationController
    from "./projectApplication.controller";

import {
    authMiddleware
} from "redis-jwt-auth";

import type {
    RequestHandler
} from "express";


const router = express.Router();


const requireAuth =
    authMiddleware({
        required: true
    }) as RequestHandler;


// OWN IDEA

router.post(
    "/own-idea",
    requireAuth,
    projectApplicationController.submitOwnIdea
);


// FACULTY PROJECT

router.post(
    "/faculty-project",
    requireAuth,
    projectApplicationController.applyFacultyProject
);


// PROJECT BANK


router.post(
    "/project-bank",
    requireAuth,
    projectApplicationController.applyProjectBank
);


// MY APPLICATIONS

router.get(
    "/my",
    requireAuth,
    projectApplicationController.getMyApplications
);



// APPLICATION DETAILS


router.get(
    "/:applicationId",
    requireAuth,
    projectApplicationController.getApplicationById
);


export default router;