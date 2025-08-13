import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';

export async function sendEmail(templateName: string, data: any, to: string, subject: string) {
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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { 
      user: process.env.SMTP_USER || process.env.EMAIL_USER, 
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASS 
    },
  });

  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_FROM || 'noreply@lifeguard.co.za';

  await transporter.sendMail({ 
    from: fromEmail, 
    to, 
    subject, 
    html 
  });
}
