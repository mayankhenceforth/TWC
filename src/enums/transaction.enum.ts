export enum TransactionMethod {
    CARD = 'card',
    WALLET = 'wallet',
    UPI = 'upi',
    DIGITAL_WALLET = 'digital_wallet',
    OTHER = 'other',
}

export enum TransactionStatus {
    PENDING = 'pending',
    SUCCESS = 'success',
    FAILED = 'failed',
    REFUNDED = 'refunded',
    PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum TransactionType {
    REFUND = 'refund',
    WITHDRAWAL = 'withdrawal',
    BONUS = 'bonus',
    OTHER = 'other',
}

export enum RefundStatus {
    NONE = 'none',
    PROCESSED = 'processed',
    FAILED = 'failed',
}