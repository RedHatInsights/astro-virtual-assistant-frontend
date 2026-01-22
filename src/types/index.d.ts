declare global {
  var insights: ChromeApi;
}

export {};

declare var window: Window & typeof globalThis;

declare global {
  interface Window {
    pendo?: {
      showGuideById: (tourId: string) => void;
    };
  }
}
