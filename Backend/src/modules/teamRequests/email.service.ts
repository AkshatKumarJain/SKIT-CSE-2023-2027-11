import net from "node:net";
import tls from "node:tls";
import { AppError } from "../../errors/AppError";
import { ERROR_CODES } from "../../errors/errorCodes";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM = process.env.SMTP_FROM || SMTP_USER;

const fail = (message: string): never => {
    throw new AppError(message, 502, ERROR_CODES.EMAIL_FAILED);
};

const escapeHtml = (value: string): string => value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const readResponse = (socket: net.Socket | tls.TLSSocket): Promise<string> => new Promise((resolve, reject) => {
    let buffer = "";
    const onData = (data: Buffer) => {
        buffer += data.toString("utf8");
        const lines = buffer.split("\r\n").filter(Boolean);
        const last = lines.at(-1) || "";
        if (/^\d{3} /.test(last)) {
            socket.off("data", onData);
            resolve(last);
        }
    };
    socket.on("data", onData);
    socket.once("error", reject);
});

const sendCommand = async (socket: net.Socket | tls.TLSSocket, command: string, expected: number[]): Promise<void> => {
    socket.write(`${command}\r\n`);
    const response = await readResponse(socket);
    const code = Number(response.slice(0, 3));
    if (!expected.includes(code)) throw new Error(`SMTP ${code}: ${response}`);
};

const sendSmtpMail = async (to: string, subject: string, text: string, html: string): Promise<void> => {
    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD || !SMTP_FROM) {
        fail("SMTP email configuration is missing");
    }

    const socket = tls.connect({ host: SMTP_HOST, port: SMTP_PORT, servername: SMTP_HOST });

    try {
        await new Promise<void>((resolve, reject) => {
            socket.once("secureConnect", resolve);
            socket.once("error", reject);
        });

        await readResponse(socket);
        await sendCommand(socket, "EHLO project-allocation.local", [250]);
        await sendCommand(socket, "AUTH LOGIN", [334]);
        await sendCommand(socket, Buffer.from(SMTP_USER).toString("base64"), [334]);
        await sendCommand(socket, Buffer.from(SMTP_PASSWORD).toString("base64"), [235]);
        await sendCommand(socket, `MAIL FROM:<${SMTP_FROM}>`, [250]);
        await sendCommand(socket, `RCPT TO:<${to}>`, [250, 251]);
        await sendCommand(socket, "DATA", [354]);

        const message = [
            `From: ${SMTP_FROM}`,
            `To: ${to}`,
            `Subject: ${subject}`,
            "MIME-Version: 1.0",
            "Content-Type: multipart/alternative; boundary=TEAM_REQUEST_BOUNDARY",
            "",
            "--TEAM_REQUEST_BOUNDARY",
            "Content-Type: text/plain; charset=UTF-8",
            "",
            text,
            "",
            "--TEAM_REQUEST_BOUNDARY",
            "Content-Type: text/html; charset=UTF-8",
            "",
            html,
            "",
            "--TEAM_REQUEST_BOUNDARY--",
        ].join("\r\n").replace(/^\./gm, "..");

        socket.write(`${message}\r\n.\r\n`);
        const response = await readResponse(socket);
        if (Number(response.slice(0, 3)) !== 250) throw new Error(`SMTP message rejected: ${response}`);
        await sendCommand(socket, "QUIT", [221]);
    } catch (error) {
        throw new AppError(
            error instanceof Error ? `Unable to send team request email: ${error.message}` : "Unable to send team request email",
            502,
            ERROR_CODES.EMAIL_FAILED
        );
    } finally {
        socket.end();
    }
};

export const sendTeamRequestEmail = async (params: {
    to: string;
    requestedStudentName: string;
    leaderName: string;
    teamId: string;
}): Promise<void> => {
    const leader = escapeHtml(params.leaderName);
    const teamId = escapeHtml(params.teamId);
    const subject = "New team-member request";
    const text = `Team Leader ${params.leaderName} has sent you a team-member request.\n\nPlease log in to the Project Allocation & Tracking application to view and respond to this request.`;
    const html = `<p>Team Leader <strong>${leader}</strong> has sent you a team-member request.</p><p>Please log in to the Project Allocation &amp; Tracking application to view and respond to this request.</p><p>Team: ${teamId}</p>`;

    await sendSmtpMail(params.to, subject, text, html);
};
