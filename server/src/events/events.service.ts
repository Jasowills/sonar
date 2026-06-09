import { Injectable } from '@nestjs/common';
import { Subject, filter, share } from 'rxjs';

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
    this.events.next(event);
  }

  subscribe(userId?: string, workspaceId?: string) {
    return this.events.pipe(
      filter((e) => {
        const pass = !e.userId || !userId || e.userId === userId;
        return pass;
      }),
      share(),
    );
  }
}
