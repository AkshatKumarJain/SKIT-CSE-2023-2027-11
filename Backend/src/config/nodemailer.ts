import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
})

type EmailMessage = {
    from?: string | undefined;
    to: string;
    subject: string;
    text?: string;
    html?: string;
};

export async function sendEmail(message: EmailMessage) {
    const apiKey = process.env.BREVO_API_KEY;

    // Render's free web services block SMTP ports. Use Brevo's HTTPS API
    // there; retain SMTP as a local development fallback.
    if (!apiKey) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("BREVO_API_KEY is required to send email in production.");
        }
        return transporter.sendMail(message);
    }

    const sender = message.from || process.env.SENDER_EMAIL;
    if (!sender) {
        throw new Error("SENDER_EMAIL must be set to send email.");
    }

    const senderName = sender.match(/^([^<]+)</)?.[1]?.trim();
    const senderEmail = sender.match(/<([^>]+)>/)?.[1] || sender;
    const payload: Record<string, unknown> = {
        sender: {
            email: senderEmail,
            ...(senderName ? { name: senderName } : {}),
        },
        to: [{ email: message.to }],
        subject: message.subject,
    };

    if (message.html) {
        payload.htmlContent = message.html;
    } else if (message.text) {
        payload.textContent = message.text;
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`Brevo email request failed (${response.status}): ${detail}`);
    }

    return response.json();
}
