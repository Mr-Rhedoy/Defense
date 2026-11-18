const nodemailer = require('nodemailer');

let transporter = null;

function isEmailConfigured() {
    return Boolean(
        /^[^\s@]+@gmail\.com$/i.test(String(process.env.GMAIL_USER || '').trim()) &&
        String(process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '').length >= 16
    );
}

function getTransporter() {
    if (!isEmailConfigured()) {
        const error = new Error('Email service is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in the root .env file.');
        error.code = 'EMAIL_NOT_CONFIGURED';
        throw error;
    }

    if (!transporter) {
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER.trim(),
                pass: process.env.GMAIL_APP_PASSWORD.replace(/\s+/g, '')
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 30000
        });
    }

    return transporter;
}

async function sendEmail({ to, subject, text, html }) {
    const mailer = getTransporter();
    const fromName = String(process.env.MAIL_FROM_NAME || 'Smart-Agro').replace(/[\r\n]/g, '').slice(0, 80);
    const fromEmail = process.env.GMAIL_USER.trim();

    try {
        return await mailer.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            text,
            html
        });
    } catch (error) {
        error.isEmailDeliveryError = true;
        throw error;
    }
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));
}

async function sendOtpEmail(to, code, purpose = 'verify') {
    const reset = purpose === 'reset';
    const subject = reset ? 'Smart-Agro password reset code' : 'Verify your Smart-Agro email';
    const title = reset ? 'Password reset' : 'Email verification';
    const message = reset
        ? 'Use this one-time code to reset your Smart-Agro password.'
        : 'Use this one-time code to verify your Smart-Agro email address.';

    return sendEmail({
        to,
        subject,
        text: `${title}\n\n${message}\n\nYour code: ${code}\n\nThis code expires in 10 minutes. If you did not request it, ignore this email.`,
        html: `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f4f7f5;padding:24px;color:#17231c"><div style="max-width:520px;margin:auto;background:#fff;border-radius:14px;padding:28px"><h2 style="color:#15803d">Smart-Agro</h2><h3>${title}</h3><p>${message}</p><div style="font-size:30px;letter-spacing:8px;font-weight:700;background:#ecfdf5;padding:18px;text-align:center;border-radius:10px">${escapeHtml(code)}</div><p>This code expires in 10 minutes.</p><small>If you did not request it, you can safely ignore this email.</small></div></body></html>`
    });
}

module.exports = { sendEmail, sendOtpEmail, isEmailConfigured };
