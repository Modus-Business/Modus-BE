import { Injectable } from '@nestjs/common';

type GroupAudienceSyncHandler = (groupId: string) => Promise<void>;
type GroupCloseHandler = (groupId: string) => Promise<void>;

@Injectable()
export class ChatRoomService {
  private syncGroupAudienceHandler: GroupAudienceSyncHandler | null = null;
  private closeGroupHandler: GroupCloseHandler | null = null;

  registerSyncGroupAudienceHandler(
    handler: GroupAudienceSyncHandler,
  ): void {
    this.syncGroupAudienceHandler = handler;
  }

  registerCloseGroupHandler(handler: GroupCloseHandler): void {
    this.closeGroupHandler = handler;
  }

  async syncGroupAudience(groupId: string): Promise<void> {
    if (!this.syncGroupAudienceHandler) {
      return;
    }

    await this.syncGroupAudienceHandler(groupId);
  }

  async closeGroup(groupId: string): Promise<void> {
    if (!this.closeGroupHandler) {
      return;
    }

    await this.closeGroupHandler(groupId);
  }
}
