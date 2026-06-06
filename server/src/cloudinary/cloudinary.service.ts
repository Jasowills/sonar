import { Injectable } from '@nestjs/common';

@Injectable()
export class CloudinaryService {
  private cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? '';
  private apiKey = process.env.CLOUDINARY_API_KEY ?? '';
  private apiSecret = process.env.CLOUDINARY_API_SECRET ?? '';

  get isConfigured(): boolean {
    return !!(this.cloudName && this.apiKey && this.apiSecret);
  }

  async uploadBase64(dataUrl: string, options?: { folder?: string; publicId?: string }): Promise<string | null> {
    if (!this.isConfigured) return null;

    // dataUrl is "data:image/jpeg;base64,/9j/4AAQ..."
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) return null;

    const timestamp = Math.round(Date.now() / 1000);
    const folder = options?.folder ?? 'sonar-screenshots';
    const publicId = options?.publicId ?? `shot_${timestamp}`;

    const params: Record<string, string> = {
      file: dataUrl,
      folder,
      public_id: publicId,
      timestamp: String(timestamp),
    };

    // Build signature string
    const sigParts = Object.keys(params)
      .filter((k) => k !== 'file')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    const signature = await this.sha1Hex(sigParts + this.apiSecret);

    try {
      const formBody = new URLSearchParams();
      for (const [key, val] of Object.entries(params)) {
        formBody.append(key, val);
      }
      formBody.append('api_key', this.apiKey);
      formBody.append('signature', signature);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
        method: 'POST',
        body: formBody,
      });

      if (!res.ok) return null;

      const json = (await res.json()) as { secure_url?: string };
      return json.secure_url ?? null;
    } catch {
      return null;
    }
  }

  private async sha1Hex(input: string): Promise<string> {
    const buf = new TextEncoder().encode(input);
    const hash = await crypto.subtle.digest('SHA-1', buf);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
