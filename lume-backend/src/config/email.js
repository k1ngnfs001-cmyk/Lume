const nodemailer = require('nodemailer');

const emailUser = process.env.USER_EMAIL;
const emailPassword = process.env.USER_PASS;

if (!emailUser || !emailPassword) {
  console.warn(
    '⚠️ USER_EMAIL yoki USER_PASS Render Environment Variables ichida topilmadi.'
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
      <div style="font-family:Arial,sans-serif;background:#0a0a0a;padding:40px;">
        <div style="
          max-width:500px;
          margin:auto;
          background:#151515;
          border:1px solid #2a2a2a;
          border-radius:20px;
          padding:30px;
          color:white;
        ">
          <h1 style="text-align:center;margin:0 0 15px;">
            Lume
          </h1>

          <p style="text-align:center;color:#bbb;">
            Ваш код подтверждения:
          </p>

          <div style="
            text-align:center;
            font-size:34px;
            font-weight:bold;
            letter-spacing:10px;
            color:#7c6cff;
            margin:25px 0;
          ">
            ${otp}
          </div>

          <p style="
            text-align:center;
            color:#999;
            font-size:13px;
          ">
            Код действителен в течение 10 минут.
          </p>

          <p style="
            text-align:center;
            color:#666;
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