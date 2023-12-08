import { lerp1d } from './Interpolation';

export interface DelayedResponseConfig {
  delay: {
    min: number;
    max: number;
  };
  words: {
    min: number;
    max: number;
  };
}

export const getDelayedResponse = (message: string | undefined, config: DelayedResponseConfig) => {
  if (!message) {
    return config.delay.min;
  }

  const words = Math.min(config.words.max, Math.max(config.words.min, message.split(' ').length));
  return lerp1d(config.delay.min, config.delay.max, (words - config.words.min) / (config.words.max - config.words.min));
};
