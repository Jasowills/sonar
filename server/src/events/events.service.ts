import { Injectable } from '@nestjs/common';
import { Subject, filter } from 'rxjs';

export type SseEvent = {
  type: string;
  data: Record<string, unknown>;
  userId?: string;
  workspaceId?: string;
};

@Injectable()
export class EventsService {
  private events = new Subject<SseEvent>();

  emit(event: SseEvent) {
    console.log(`[SSE] emit type=${event.type} userId=${event.userId ?? '-'}`);
    this.events.next(event);
  }

  subscribe(userId?: string, workspaceId?: string) {
    console.log(`[SSE] subscribe userId=${userId ?? '-'} workspaceId=${workspaceId ?? '-'}`);
    return this.events.pipe(
      filter(
        (e) => {
          const pass = !e.userId || !userId || e.userId === userId;
          if (!pass) console.debug(`[SSE] filtered event ${e.type} for user ${userId}`);
          return pass;
        },
      ),
    );
  }
}
