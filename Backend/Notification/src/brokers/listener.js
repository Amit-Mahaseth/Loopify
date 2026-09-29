import SendEmail from '../utils/email.js';
import { SubscribeToQueue } from './rabbitmq.js';


async function StartListener(){
    await SubscribeToQueue('user_registered',async (data)=>{
        const {email,Fullname:{firstname,lastname},role}=data;
      const Template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to Our Music Platform</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f4f4f5;
  font-family: Arial, Helvetica, sans-serif;
">

  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 15px;">

        <!-- Main Card -->
        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 600px;
            width: 100%;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          "
        >

          <!-- Header -->
          <tr>
            <td
              align="center"
              style="
                background: linear-gradient(135deg, #7c3aed, #ec4899);
                padding: 40px 20px;
              "
            >

              <!-- Music Icon -->
              <div style="
                font-size: 48px;
                margin-bottom: 15px;
              ">
                🎵 🎧 🎶
              </div>

              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 30px;
                font-weight: 700;
              ">
                Welcome to the Music Family!
              </h1>

              <p style="
                margin: 12px 0 0;
                color: #f3e8ff;
                font-size: 16px;
              ">
                Your journey into the world of music starts here.
              </p>

            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 35px;">

              <h2 style="
                margin: 0 0 15px;
                color: #18181b;
                font-size: 24px;
              ">
                Hey ${firstname} ${lastname}! 👋
              </h2>

              <p style="
                color: #52525b;
                font-size: 16px;
                line-height: 1.7;
                margin: 0 0 18px;
              ">
                We're excited to have you join us as a
                <strong style="color: #7c3aed;">
                  ${role}
                </strong>
                on our platform.
              </p>

              <p style="
                color: #52525b;
                font-size: 16px;
                line-height: 1.7;
                margin: 0 0 25px;
              ">
                Discover new sounds, explore amazing artists,
                create playlists, and enjoy your favorite music
                whenever inspiration strikes. 🎧
              </p>

              <!-- Feature Box -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  background: #faf5ff;
                  border-radius: 12px;
                  margin-bottom: 30px;
                "
              >
                <tr>
                  <td style="padding: 22px;">

                    <p style="
                      margin: 0 0 12px;
                      color: #18181b;
                      font-size: 15px;
                    ">
                      🎵 <strong>Discover Music</strong>
                    </p>

                    <p style="
                      margin: 0 0 12px;
                      color: #18181b;
                      font-size: 15px;
                    ">
                      🎤 <strong>Explore Artists</strong>
                    </p>

                    <p style="
                      margin: 0;
                      color: #18181b;
                      font-size: 15px;
                    ">
                      ❤️ <strong>Create Your Collection</strong>
                    </p>

                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="margin: 0 auto 30px;"
              >
                <tr>
                  <td
                    align="center"
                    style="
                      border-radius: 10px;
                      background: #7c3aed;
                    "
                  >
                    <a
                      href="https://yourwebsite.com"
                      style="
                        display: inline-block;
                        padding: 14px 30px;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 16px;
                        font-weight: 600;
                      "
                    >
                      🎧 Start Listening
                    </a>
                  </td>
                </tr>
              </table>

              <p style="
                color: #52525b;
                font-size: 15px;
                line-height: 1.6;
                margin: 0;
              ">
                Thanks for choosing us. We're looking forward to
                being part of your musical journey. 🎶
              </p>

              <p style="
                color: #18181b;
                font-size: 15px;
                line-height: 1.6;
                margin: 25px 0 0;
              ">
                Best regards,<br />
                <strong>The Music Team 🎵</strong>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td
              align="center"
              style="
                background: #18181b;
                padding: 25px 20px;
              "
            >
              <p style="
                margin: 0 0 8px;
                color: #ffffff;
                font-size: 14px;
                font-weight: 600;
              ">
                🎶 Keep the music playing!
              </p>

              <p style="
                margin: 0;
                color: #a1a1aa;
                font-size: 12px;
              ">
                © 2026 Your Music Platform. All rights reserved.
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
`;
      await SendEmail(email,'Welcome to Our Service','',Template)
    })

    await SubscribeToQueue('user_logged_in',async (data)=>{
      const {email,Fullname:{firstname,lastname},role}=data;
      const LoginTemplate = `
<!DOCTYPE html>
<html>
<body style="
  margin:0;
  padding:0;
  background:#f4f4f5;
  font-family:Arial,Helvetica,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding:40px 15px;">

      <table width="600" style="
        max-width:600px;
        width:100%;
        background:#ffffff;
        border-radius:16px;
        overflow:hidden;
      ">

        <!-- Header -->
        <tr>
          <td align="center" style="
            background:#18181b;
            padding:40px 20px;
          ">

            <div style="font-size:45px;">
              🔐 🎧 🎵
            </div>

            <h1 style="
              color:#ffffff;
              margin:15px 0 0;
            ">
              Login Successful
            </h1>

          </td>
        </tr>

        <!-- Content -->
        <tr>
          <td style="padding:40px 35px;">

            <h2>
              Hey ${firstname}! 👋
            </h2>

            <p style="
              color:#52525b;
              font-size:16px;
              line-height:1.7;
            ">
              You have successfully logged into your account. 🎉
            </p>

            <!-- Login Info -->
            <div style="
              background:#f4f4f5;
              padding:20px;
              border-radius:12px;
              margin:25px 0;
            ">

              <p style="margin:0 0 12px;">
                🔐 <strong>Login Status:</strong> Successful
              </p>

              <p style="margin:0 0 12px;">
                📧 <strong>Account:</strong> ${email}
              </p>

              <p style="margin:0;">
                🎵 <strong>Platform:</strong> Music Platform
              </p>

            </div>

            <p style="
              color:#52525b;
              font-size:15px;
              line-height:1.6;
            ">
              If this was you, you can safely continue enjoying
              your music. 🎶
            </p>

            <p style="
              color:#dc2626;
              font-size:14px;
              line-height:1.6;
            ">
              ⚠️ If you don't recognize this login, please
              secure your account immediately.
            </p>

            <p style="margin-top:30px;">
              Stay safe and keep listening! 🎧<br><br>
              <strong>The Music Team</strong>
            </p>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="
            background:#18181b;
            padding:25px;
            color:#a1a1aa;
          ">

            <p style="margin:0;">
              🎶 Your music. Your vibe.
            </p>

            <p style="
              font-size:12px;
              margin-top:10px;
            ">
              © 2026 Your Music Platform
            </p>

          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>
`;
await SendEmail(email,'Login Notification','',LoginTemplate)
    })
}
export default StartListener;