const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  console.log(process.env.EMAIL_USERNAME, "eu");

  console.log(process.env.EMAIL_PASSWORD, "ep");
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USERNAME,
      // port: process.env.EMAIL_PORT,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  const mailOptions = {
    from: process.env.EMAIL_USERNAME,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
