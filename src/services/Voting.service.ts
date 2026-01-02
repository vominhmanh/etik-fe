import { AxiosResponse } from 'axios';

import { VotingAllInfoResponse } from '@/types/voting';

import BaseHttpService from './BaseHttp.service';

class VotingService extends BaseHttpService {
  /**
   * Get all voting information for an event
   * @param eventId - The event ID (default: 51)
   * @returns Promise with voting categories and nominees
   */
  async getAllInfo(eventId: number = 51): Promise<AxiosResponse<VotingAllInfoResponse>> {
    return this.get(`https://api.etik.vn/mini-app-voting/${eventId}/all-info`);
  }
}

export default new VotingService();

