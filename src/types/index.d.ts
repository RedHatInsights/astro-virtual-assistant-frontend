declare global {
  var insights: ChromeApi;
}

export {};

declare global {
  interface Window {
    pendo?: {
      showGuideById: (tourId: string) => void;
    };
  }
}
