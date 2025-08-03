import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { env } from "./env";
import { emailOTP } from "better-auth/plugins";
import { resend } from "./resend";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql", // or "mysql", "postgresql", ...etc
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      prompt: "select_account",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        const { data, error } = await resend.emails.send({
          from: "Med Academy DZ <onboarding@resend.dev>",
          to: [email],
          subject: "Med Academy DZ - Email Verification",
          html: `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>OTP Verification</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; background-color: #f4f6f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: auto; background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
        <div style="text-align: center; padding-bottom: 20px;">
          <img src="https://raw.githubusercontent.com/fatah255/med-academy-dz/main/public/logo.png" alt="Med Academy DZ Logo" style="width: 100px; margin-bottom: 10px;">
          <h1 style="margin: 0; font-size: 20px; color: #007b83;">Med Academy DZ</h1>
        </div>
        <div style="text-align: center; color: #333333;">
          <h2 style="font-size: 22px;">Verify Your Email</h2>
          <p style="font-size: 16px;">Use the OTP below to verify your email address:</p>
          <div style="display: inline-block; font-size: 28px; font-weight: bold; background-color: #e6f7fa; padding: 15px 25px; border-radius: 6px; letter-spacing: 8px; margin: 20px 0; color: #007b83;">
            ${otp}
          </div>
          <p style="font-size: 14px;">This code is valid for the next 10 minutes.</p>
          <p style="font-size: 14px;">If you didn’t request this, please ignore this email.</p>
        </div>
        <div style="text-align: center; font-size: 12px; color: #999999; margin-top: 30px;">
          &copy; 2025 Med Academy DZ. All rights reserved.<br>
          Contact us: <a href="mailto:support@medacademy.dz" style="color: #007b83; text-decoration: none;">na_lebkara@esi.dz</a>
        </div>
      </div>
    </body>
    </html>
          `,
        });
      },
    }),
  ],
});
