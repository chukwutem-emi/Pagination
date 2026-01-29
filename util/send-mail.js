const {MailtrapClient} = require("mailtrap");

const client = new MailtrapClient({
    token: process.env.MAILTRAP_API_TOKEN,
});

/**
 * @param {string} to - recipient email
 * @param {string} subject - email subject
 * @param {string} text - plain text body
 * @param {string} html - optional HTML body
 */

function sendEmail({to, subject, text, html}) {
    const sender = {
        email: "hello@demomailtrap.co",
        name: "ShopOnline"
    };

    const recipients = [{email: to}];

    return client.send({
        from: sender,
        to: recipients,
        subject,
        text,
        html,
        category: "Transactional",
    })
    .then((response) => {
        console.log(`Email sent successfully to ${to}`);
        return response;
    })
    .catch((err) => {
        console.log(`Failed to send email to ${to}:`, err)
    })
}
module.exports = sendEmail;