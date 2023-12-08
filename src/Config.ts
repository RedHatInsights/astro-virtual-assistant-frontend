const config = {
  messages: {
    delays: {
      // Artificial delays (ms) to avoid overwhelming the user
      assistantDelayResponse: {
        delay: {
          min: 500,
          max: 2000,
        },
        words: {
          max: 15,
          min: 5,
        },
      },
      minAssistantDelayResponse: 500,
      maxAssi: 2000,
      maxTextLength: 100,
      feedback: 1000,
    },
  },
};

const readonlyConfig: Readonly<typeof config> = config;

export default readonlyConfig;
