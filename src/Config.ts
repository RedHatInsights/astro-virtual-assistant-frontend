const config = {
  messages: {
    delays: {
      // Artificial delays (ms) to avoid overwhelming the user
      minAssistantResponse: 1200,
      feedback: 1000,
    },
    thumbs: {
      payloads: {
        up: '/intent_core_yes',
        down: '/intent_core_no',
      },
    },
  },
};

const readonlyConfig: Readonly<typeof config> = config;

export default readonlyConfig;
