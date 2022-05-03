export enum MessageType {
    Information,
    Success,
    Error
}

export interface FeedbackMessage {
    type: MessageType;
    text: string;
}