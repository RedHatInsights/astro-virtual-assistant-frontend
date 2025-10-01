export interface FeedbackState {
  positive?: boolean;
  sent: boolean;
  sending: boolean;
  detailOpened: boolean;
  freeFormValue: string;
  showFeedbackCompleted: boolean;
}

export const DEFAULT_WELCOME_CONTENT = `Hello Hallo Hola Bonjour こんにちは Olá مرحباً Ahoj Ciao 안녕하세요 Hallo 你好\n\nGet answers from our library of support resources.`;
