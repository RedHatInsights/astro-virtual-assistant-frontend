import { Metadata } from '../types/Metadata';

export const buildMetadata = (): Metadata => {
  return {
    current_url: window.location.href,
  };
};
