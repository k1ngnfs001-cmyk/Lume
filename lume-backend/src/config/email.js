const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: email,
    subject: 'Код подтверждения Lume',
    text: `Ваш код для входа в Lume: ${otp}\nНикому не сообщайте этот код.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP успешно отправлен на ${email}`);
  } catch (error) {
    console.error('Ошибка отправки почты:', error);
    throw new Error('Не удалось отправить код на почту');
  }
};

module.exports = sendOTPEmail;