const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL, // Твоя почта
    pass: process.env.USER_PASS,  // Твой пароль приложения
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