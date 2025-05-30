const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });
  }

  async send(to, subject, text) {
    try {
      await this.transporter.sendMail({
        from: `"Sistema de Aulas" <${process.env.MAIL_USER}>`,
        to,
        subject,
        text,
      });
    } catch (error) {
      console.error(`Error enviando correo a ${to}:`, error.message);
    }
  }
}

module.exports = EmailService;
