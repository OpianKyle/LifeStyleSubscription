import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';

export async function sendEmail(templateName: string, data: any, to: string, subject: string) {
  // Check if email service is configured
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  
  if (!emailUser || !emailPass) {
    throw new Error('Email service not configured - missing SMTP credentials');
  }

  const filePath = path.join(process.cwd(), 'emails', 'templates', `${templateName}.mjml`);
  
  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template ${templateName}.mjml not found`);
  }
  
  const mjmlTemplate = fs.readFileSync(filePath, 'utf8');
  const compiled = Handlebars.compile(mjmlTemplate);
  const mjml = compiled(data);
  const { html, errors } = mjml2html(mjml);
  
  if (errors?.length) {
    console.error('MJML compilation errors:', errors);
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: port,
    secure: port === 465, // true for 465 (SSL), false for other ports (TLS)
    auth: { 
      user: emailUser, 
      pass: emailPass 
    },
  });

  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@lifeguard.co.za';

  try {
    await transporter.sendMail({ 
      from: fromEmail, 
      to, 
      subject, 
      html 
    });
  } catch (error: any) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
