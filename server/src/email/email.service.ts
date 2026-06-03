import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: port === '465',
        auth: { user, pass },
      });
      this.logger.log(`SMTP configured — ${user} via ${host}:${port}`);
    } else {
      this.logger.warn('SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to enable email alerts');
    }
  }

  async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.warn(`Email not sent (SMTP not configured): ${subject} → ${to}`);
      return false;
    }
    try {
      const from = process.env.SMTP_FROM || 'watchdog@localhost';
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email sent: ${subject} → ${to}`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email: ${err}`);
      return false;
    }
  }
}
