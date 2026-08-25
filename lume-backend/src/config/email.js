// const { Resend } = require('resend');

// const apiKey = process.env.RESEND_API_KEY;

// if (!apiKey) {
//   console.warn(
//     '⚠️ RESEND_API_KEY topilmadi. Render Environment Variables ni tekshiring.'
//   );
// }

// const resend = new Resend(apiKey);

// const sendOtpEmail = async (to, otp) => {
//   if (!process.env.RESEND_API_KEY) {
//     throw new Error(
//       'RESEND_API_KEY не настроен'
//     );
//   }

//   if (!to) {
//     throw new Error(
//       'Email получателя не указан'
//     );
//   }

//   if (!otp) {
//     throw new Error(
//       'OTP код не указан'
//     );
//   }

//   try {
//     const { data, error } = await resend.emails.send({
//       from: 'Lume <onboarding@resend.dev>',
//       to: [to],
//       subject: 'Lume — Код подтверждения',

//       text:
//         `Ваш код подтверждения Lume: ${otp}\n\n` +
//         `Код действителен в течение 10 минут.\n\n` +
//         `Если вы не пытались войти в Lume, ` +
//         `проигнорируйте это письмо.`,

//       html: `
//         <!DOCTYPE html>
//         <html lang="ru">
//         <head>
//           <meta charset="UTF-8" />
//           <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//           <title>Lume — Код подтверждения</title>
//         </head>

//         <body style="
//           margin: 0;
//           padding: 0;
//           background: #0a0a0a;
//           font-family: Arial, Helvetica, sans-serif;
//         ">

//           <div style="
//             padding: 40px 20px;
//             background: #0a0a0a;
//           ">

//             <div style="
//               width: 100%;
//               max-width: 500px;
//               margin: 0 auto;
//               background: #151515;
//               border: 1px solid #2a2a2a;
//               border-radius: 22px;
//               padding: 35px;
//               box-sizing: border-box;
//               color: #ffffff;
//             ">

//               <h1 style="
//                 margin: 0 0 25px;
//                 text-align: center;
//                 font-size: 30px;
//                 font-weight: 700;
//                 color: #ffffff;
//               ">
//                 Lume
//               </h1>

//               <p style="
//                 margin: 0;
//                 text-align: center;
//                 color: #bdbdbd;
//                 font-size: 15px;
//                 line-height: 1.6;
//               ">
//                 Ваш код подтверждения:
//               </p>

//               <div style="
//                 margin: 28px 0;
//                 text-align: center;
//                 font-size: 38px;
//                 font-weight: 700;
//                 letter-spacing: 10px;
//                 color: #7c6cff;
//               ">
//                 ${otp}
//               </div>

//               <p style="
//                 margin: 0;
//                 text-align: center;
//                 color: #999999;
//                 font-size: 13px;
//                 line-height: 1.5;
//               ">
//                 Код действителен в течение 10 минут.
//               </p>

//               <div style="
//                 height: 1px;
//                 background: #252525;
//                 margin: 28px 0;
//               "></div>

//               <p style="
//                 margin: 0;
//                 text-align: center;
//                 color: #666666;
//                 font-size: 12px;
//                 line-height: 1.6;
//               ">
//                 Если вы не пытались войти в Lume,
//                 просто проигнорируйте это письмо.
//               </p>

//             </div>

//           </div>

//         </body>
//         </html>
//       `
//     });

//     if (error) {
//       console.error(
//         '❌ Resend API error:',
//         error
//       );

//       throw new Error(
//         error.message ||
//         'Не удалось отправить email через Resend'
//       );
//     }

//     console.log(
//       '📧 OTP успешно отправлен через Resend:',
//       to
//     );

//     console.log(
//       '📨 Resend message ID:',
//       data?.id || 'unknown'
//     );

//     return data;
//   } catch (error) {
//     console.error(
//       '❌ Ошибка отправки OTP через Resend:',
//       error
//     );

//     throw error;
//   }
// };

// module.exports = {
//   sendOtpEmail
// };