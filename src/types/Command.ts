export const FINISH_CONVERSATION = 'core_finish_conversation';
export const PERSONAL_INFORMATION_REDIRECT = 'personal_information_redirect';
export const PASSWORD_REDIRECT = 'password_redirect';
export const TOUR_START = 'tour_start';
export type Command = typeof FINISH_CONVERSATION | typeof PERSONAL_INFORMATION_REDIRECT | typeof PASSWORD_REDIRECT | typeof TOUR_START;
