const nodemailer = require('nodemailer');

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_APP_PASSWORD;

if (!emailUser || !emailPassword) {
  console.warn(
    '⚠️ EMAIL_USER yoki EMAIL_APP_PASSWORD .env/Render Environment Variables ichida topilmadi.'
  );
}

const transporter = nodemailer.createTransport({
  service: 'gmail',

  auth: {
    user: emailUser,
    pass: emailPassword
  }
});

const sendOtpEmail = async (to, otp) => {
  if (!emailUser || !emailPassword) {
    throw new Error(
      'Email konfiguratsiyasi sozlanmagan.'
    );
  }

  const mailOptions = {
    from: `"Lume" <${emailUser}>`,
    to,

    subject: 'Lume — Код подтверждения',

    text:
      `Ваш код подтверждения Lume: ${otp}\n\n` +
      `Код действителен в течение 10 минут.\n` +
      `Если это были не вы, просто проигнорируйте это письмо.`,

    html: `
      <div style="font-family: Arial, sans-serif; background:#0a0a0a; padding:40px;">
        <div style="
          max-width:500px;
          margin:0 auto;
          background:#151515;
          border:1px solid #2a2a2a;
          border-radius:20px;
          padding:30px;
          color:white;
        ">
          <h1 style="
            margin:0 0 15px;
            text-align:center;
            font-size:28px;
          ">
            Lume
          </h1>

          <p style="
            color:#bbbbbb;
            text-align:center;
            font-size:15px;
          ">
            Ваш код подтверждения:
          </p>

          <div style="
            margin:25px 0;
            text-align:center;
            font-size:34px;
            font-weight:bold;
            letter-spacing:10px;
            color:#7c6cff;
          ">
            ${otp}
          </div>

          <p style="
            color:#999999;
            text-align:center;
            font-size:13px;
          ">
            Код действителен в течение 10 минут.
          </p>

          <p style="
            color:#666666;
            text-align:center;
            font-size:12px;
            margin-top:25px;
          ">
            Если вы не пытались войти в Lume,
            проигнорируйте это письмо.
          </p>
        </div>
      </div>
    `
  };

  await transporter.sendMail(
    mailOptions
  );
};

module.exports = {
  sendOtpEmail,
  transporter
};