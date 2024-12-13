const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: "smtp.zoho.eu",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    // user: 'nazarkozynets030606@zohomail.eu',
     pass: process.env.EMAIL_PASS,
    // pass: 'NazKoz030606_'
  },
});

const sendMail = (to = "", title = "", text = "", type = "", path = "") => {
  const mailOptions = (() => {
    if (type === "pdf") {
      return {
        from: process.env.EMAIL_USER,
        to: to,
        subject: title,
        html: text,
        attachments: [
          {
              filename: 'invoice.pdf',
              path
          }
      ]
      };
    } else if (type === "html") {
      return {
        from: process.env.EMAIL_USER,
        to: to,
        subject: title,
        html: text,
      };
    } else {
      return {
        from: process.env.EMAIL_USER,
        to: to,
        subject: title,
        text: text,
      };
    }
  })();

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Ошибка при отправке письма:", error);
    } else {
      console.log("Письмо успешно отправлено!");
      console.log("ID сообщения:", info.messageId);
    }
  });
};

export default sendMail;
