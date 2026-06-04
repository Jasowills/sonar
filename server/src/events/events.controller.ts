import { Controller, Get, Req, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request } from 'express';
import { Public } from '../auth/public.decorator';
import { extractBearerToken, verifyToken } from '../auth/jwt';
import { EventsService, type SseEvent } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Sse('stream')
  stream(@Req() req: Request): Observable<MessageEvent> {
    const token =
      extractBearerToken(req.headers.authorization) ||
      (req.query.token as string);
    const user = token ? verifyToken(token) : null;
    console.log(`[SSE] stream connected userId=${user?.sub ?? '-'}`);

    return this.eventsService.subscribe(user?.sub).pipe(
      map((event: SseEvent) => {
        console.debug(`[SSE] send type=${event.type} userId=${event.userId ?? '-'}`);
        const data = JSON.stringify(event);
        return new MessageEvent('message', { data });
      }),
    );
  }
}
