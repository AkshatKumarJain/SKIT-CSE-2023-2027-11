import crypto from "node:crypto";
import type { Request, Response } from "express";
import { sendEmail } from "../../config/nodemailer";
import { redisClient } from "../../config/redis";
import userController from "../users/user.controller";
import userModel from "../users/user.model";
import userService from "../users/user.service";

jest.mock("../../config/nodemailer", () => ({ sendEmail: jest.fn() }));
jest.mock("../../config/redis", () => ({
    redisClient: { setEx: jest.fn(), get: jest.fn(), eval: jest.fn() },
}));

const email = "password-reset-test@example.com";
const newPassword = "New-password-1";
const token = "a".repeat(64);
const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

function mockUser() {
    const user = new userModel({ email });
    jest.spyOn(userModel, "findOne").mockResolvedValue(user);
    const comparePassword = jest.spyOn(user, "comparePassword").mockResolvedValue(false);
    const save = jest.spyOn(user, "save").mockResolvedValue(user);
    return { user, comparePassword, save };
}

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
});

test("emails the raw token and stores only its hash with a five-minute TTL", async () => {
    const { user } = mockUser();
    jest.mocked(sendEmail).mockResolvedValue({ messageId: "test" });

    await userService.forgotPassword(email);

    const message = jest.mocked(sendEmail).mock.calls[0]?.[0];
    const emailedToken = message?.text?.match(/\/reset-password\/([a-f0-9]{64})$/)?.[1] ?? "";
    expect(emailedToken).toHaveLength(64);
    expect(message?.to).toBe(email);
    expect(redisClient.setEx).toHaveBeenCalledWith(
        `password-reset:v2:${user._id}`,
        300,
        crypto.createHash("sha256").update(emailedToken).digest("hex"),
    );
});

test("rejects a reset request without the emailed token", async () => {
    const { save } = mockUser();
    const request = { body: { email, newPassword } } as Request;

    await expect(userController.resetPassword(request, {} as Response)).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_TOKEN",
    });
    expect(save).not.toHaveBeenCalled();
});

test.each([null, "b".repeat(64)])("rejects an absent or mismatched reset record (%s)", async (record) => {
    const { comparePassword, save } = mockUser();
    jest.mocked(redisClient.get).mockResolvedValue(record);

    await expect(userService.resetPassword(newPassword, email, token)).rejects.toMatchObject({
        code: "INVALID_TOKEN",
    });
    expect(comparePassword).not.toHaveBeenCalled();
    expect(redisClient.eval).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
});

test("keeps the token available when the new password matches the current password", async () => {
    const { comparePassword, save } = mockUser();
    jest.mocked(redisClient.get).mockResolvedValue(tokenHash);
    comparePassword.mockResolvedValue(true);

    await expect(userService.resetPassword(newPassword, email, token)).rejects.toMatchObject({
        statusCode: 422,
    });
    expect(redisClient.eval).not.toHaveBeenCalled();
    expect(save).not.toHaveBeenCalled();
});

test("saves the new password only for the request that consumes the token", async () => {
    const { user, save } = mockUser();
    jest.mocked(redisClient.get).mockResolvedValue(tokenHash);
    jest.mocked(redisClient.eval).mockResolvedValueOnce(1).mockResolvedValueOnce(0);

    const results = await Promise.allSettled([
        userService.resetPassword(newPassword, email, token),
        userService.resetPassword(newPassword, email, token),
    ]);

    expect(results).toEqual([
        { status: "fulfilled", value: undefined },
        { status: "rejected", reason: expect.objectContaining({ code: "INVALID_TOKEN" }) },
    ]);
    expect(redisClient.eval).toHaveBeenCalledWith(expect.any(String), {
        keys: [`password-reset:v2:${user._id}`],
        arguments: [tokenHash],
    });
    expect(user.password).toBe(newPassword);
    expect(save).toHaveBeenCalledTimes(1);
});
