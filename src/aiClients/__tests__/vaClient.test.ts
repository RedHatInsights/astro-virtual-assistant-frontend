import VAClient from '../vaClient';

describe('VAClient', () => {
  it('should create an instance without crashing', () => {
    const client = new VAClient();
    expect(client).toBeInstanceOf(VAClient);
  });
});
