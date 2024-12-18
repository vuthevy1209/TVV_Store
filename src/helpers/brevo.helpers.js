// const brevo = require('@getbrevo/brevo');
var brevo = require('sib-api-v3-sdk');

let defaultClient = brevo.ApiClient.instance;

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const transactionalEmailsApi = new brevo.TransactionalEmailsApi();

/**
 * Send account confirmation email
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} confirmationLink - Account confirmation link
 */
async function sendAccountConfirmationEmail(toEmail, toName, confirmationLink) {
    try {
        const sender = {
            name: 'TVV Store',
            email: process.env.SENDER_EMAIL
        };

        const receivers = [
            {
                email: toEmail,
            }
        ];

        // Await the API call to handle the promise
        const response = await transactionalEmailsApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: 'Account Confirmation',
            htmlContent: `
            <p>Hello ${toName},</p>
            <p>Please confirm your account by clicking the link below:</p>
            <p><a href="${confirmationLink}">Confirm Account</a></p>
        `,
        });

        // Log the response to confirm the API call was successful
        console.log('Email sent successfully:', response);
    } catch (error) {
        // Log the error message
        console.error('Error sending account confirmation email:', error.message);

        // Check if the error has a response property
        if (error.response) {
            // Log the response status and data for more details
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }

        // Throw a new error to be handled by the calling function
        throw new Error('Failed to send account confirmation email');
    }

}


async function sendForgotPasswordEmail(toEmail, toName, username, temporaryPassword) {
    try {
        const sender = {
            name: 'TVV Store',
            email: process.env.SENDER_EMAIL
        };

        const receivers = [
            {
                email: toEmail,
                name: toName
            }
        ];

        const response = await transactionalEmailsApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: 'Temporary Password',
            htmlContent: `
                <p>Hello ${toName},</p>
                <p>Your username is: ${username}</p>
                <p>Your temporary password is: ${temporaryPassword}</p>
                <p>Please log in and change your password immediately.</p>
            `,
        });

        console.log('Temporary password email sent successfully:', response);
        return response;
    } catch (error) {
        console.error('Error sending temporary password email:', error.message);
        if (error.response) {
            console.error('Response Error Details:', error.response.body);
        }
        throw new Error('Failed to send temporary password email');
    }


}

/**
 * Send reset password confirmation email
 * @param {string} toEmail - Recipient email address
 * @param {string} toName - Recipient name
 * @param {string} confirmationLink - Reset password confirmation link
 */
async function sendResetPasswordConfirmationEmail(toEmail, toName, confirmationLink) {
    try {
        const sender = {
            name: 'TVV Store',
            email: process.env.SENDER_EMAIL
        };

        const receivers = [
            {
                email: toEmail,
            }
        ];

        const response = await transactionalEmailsApi.sendTransacEmail({
            sender,
            to: receivers,
            subject: 'Reset Password Confirmation',
            htmlContent: `
            <p>Hello ${toName},</p>
            <p>Please confirm your request to reset your password by clicking the link below:</p>
            <p><a href="${confirmationLink}">Confirm Reset Password</a></p>
        `,
        });

        console.log('Reset password confirmation email sent successfully:', response);
    } catch (error) {
        console.error('Error sending reset password confirmation email:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        throw new Error('Failed to send reset password confirmation email');
    }
}

module.exports = {sendAccountConfirmationEmail, sendForgotPasswordEmail, sendResetPasswordConfirmationEmail};
