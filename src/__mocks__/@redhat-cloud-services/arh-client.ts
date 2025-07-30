// Mock ARH client
export class IFDClient {
  constructor(private config: any) {}

  // Mock any methods that might be used
  query = jest.fn().mockResolvedValue({ data: 'mock response' });
  getConversations = jest.fn().mockResolvedValue([]);
  createConversation = jest.fn().mockResolvedValue({ id: 'new-conv' });
}

export const __resetMocks = () => {
  IFDClient.prototype.query.mockClear();
  IFDClient.prototype.getConversations.mockClear();
  IFDClient.prototype.createConversation.mockClear();
};
