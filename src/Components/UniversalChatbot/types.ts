export interface FeedbackState {
  positive?: boolean;
  sent: boolean;
  sending: boolean;
  detailOpened: boolean;
  freeFormValue: string;
  showFeedbackCompleted: boolean;
}
