// src/phonepe/phonepe.service.ts
import { HttpException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import { randomUUID } from 'crypto';
import { PayoutRequestDto } from './dto/payout-request-dto';
import { InitiatePaymentDto } from './dto/initiate-payment-dto';
import { AutoPayMandateDto } from './dto/auto-pay-mandate-dto';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument, PaymentStatus } from './schema/phonepe.schema';
import { Model } from 'mongoose';
import { TransactionStatus } from 'src/enums/transaction.enum';

@Injectable()
export class PhonePeService {
    private readonly logger = new Logger(PhonePeService.name);
    private merchantId: string;
    private saltKey: string;
    private saltIndex: number;
    private phonePayBaseUrl: string;
    private appBaseUrl: string;
    private payoutBaseUrl: string;

    constructor(private configService: ConfigService,
        @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>
    ) {
        this.merchantId = this.configService.getOrThrow<string>('PHONEPE_MERCHANT_ID');
        this.saltKey = this.configService.getOrThrow<string>('PHONEPE_SALT_KEY');
        this.saltIndex = this.configService.getOrThrow<number>('PHONEPE_SALT_INDEX');
        this.phonePayBaseUrl = this.configService.getOrThrow<string>('PHONEPE_BASE_URL');
        this.appBaseUrl = this.configService.getOrThrow<string>('APP_BASE_URL');
        this.payoutBaseUrl = this.configService.getOrThrow<string>('PHONEPE_PAYOUT_BASE_URL') || 'https://api-preprod.phonepe.com/apis/pg-sandbox/payout/v1';

        if (!this.merchantId || !this.saltKey) {
            throw new Error('PhonePe configuration is incomplete');
        }

        this.logger.log(`Initialized with base URL: ${this.phonePayBaseUrl}`);
    }

    async initiatePayment(paymentDto: InitiatePaymentDto) {
        try {
            const { amount, userId } = paymentDto;
            const merchantTransactionId = paymentDto.merchantTransactionId || `txn_${randomUUID()}`;
            const callbackUrl = paymentDto.callbackUrl || `${this.appBaseUrl}/payment/callback`;

            const payment = await this.paymentModel.create(
                {
                    merchantId:this.merchantId,
                    merchantTransactionId,
                    amount,
                    userId,
                    status: PaymentStatus.PENDING,
                    callbackUrl,
                    createdAt: new Date()

                }
            )


            const payload = {
                merchantId: this.merchantId,
                merchantTransactionId,
                merchantUserId: userId,
                amount: amount * 100,
                redirectUrl: callbackUrl,
                redirectMode: 'POST',
                callbackUrl: callbackUrl,
                paymentInstrument: {
                    type: 'PAY_PAGE',
                },
            };

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const apiEndpoint = '/pg/v1/pay';
            const checksum = this.generateChecksum(base64Payload, apiEndpoint);

            this.logger.log(`Initiating payment for transaction: ${merchantTransactionId}`);

            const response = await axios.post(
                `${this.phonePayBaseUrl}${apiEndpoint}`,
                { request: base64Payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'X-MERCHANT-ID': this.merchantId,
                        accept: 'application/json',
                    },
                    timeout: 10000,
                },
            );

            if (response.data.success && response.data.data?.instrumentResponse?.redirectInfo) {

                const data = await this.paymentModel.findOneAndUpdate(
                    { merchantTransactionId },
                    {
                        status:PaymentStatus.PENDING,
                        phonePeResponse: response.data,
                        redirectUrl: response.data.data.instrumentResponse.redirectInfo.url
                    }
                );
                await data?.save()

                console.log("data:",data)


                return {
                    success: true,
                    message: 'Payment initiated',
                    merchantTransactionId,
                    redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
                };
            } else {

                await this.paymentModel.findOneAndUpdate(
                    { merchantTransactionId },
                    {
                        status: PaymentStatus.FAILED,
                        phonePeResponse: response.data,
                        errorMessage: response.data.message || 'Failed to initiate payment'
                    }
                );

                throw new Error(response.data.message || 'Failed to initiate payment');
            }
        } catch (error: any) {
            this.logger.error(`Payment initiation error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to initiate payment',
                error.response?.status || 500,
            );
        }
    }

    async verifyPayment(merchantTransactionId: string) {
        try {
            const path = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;
            const checksum = this.generateChecksum('', path);

            this.logger.log(`Checking payment status for transaction: ${merchantTransactionId}`);


            const response = await axios.get(`${this.phonePayBaseUrl}${path}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': this.merchantId,
                    accept: 'application/json',
                },
                timeout: 10000,
            });

            return {
                success: true,
                data: response.data,
            };
        } catch (error: any) {
            this.logger.error(`Verify payment error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to verify payment',
                error.response?.status || 500,
            );
        }
    }

    async processCallback(callbackData: { body: any; headers: any }): Promise<{ success: boolean; transactionData?: any }> {
        try {
            this.logger.log('Payment callback received');

            const isValid = this.validateCallbackChecksum(callbackData);

            if (!isValid) {
                this.logger.error('Invalid callback checksum');
                return { success: false };
            }

            this.logger.log('Callback checksum validated successfully');

            const responseBuffer = Buffer.from(callbackData.body.response, 'base64');
            const decodedData = JSON.parse(responseBuffer.toString('utf8'));

            this.logPaymentDetails(decodedData);
            console.log(decodedData)

            return {
                success: true,
                transactionData: decodedData,
            };
        } catch (error) {
            this.logger.error(`Error processing callback: ${error}`);
            return { success: false };
        }
    }

    async payToDriverUpi(payoutDto: PayoutRequestDto): Promise<any> {
        try {
            const { amount, recipientUpiId, recipientName, purpose, notes } = payoutDto;

            if (!recipientUpiId) {
                throw new Error('UPI ID is required for driver payout');
            }

            const merchantTransactionId = `driver_payout_${randomUUID()}`;

            const payload = {
                merchantId: this.merchantId,
                merchantTransactionId,
                amount: amount * 100,
                purpose: purpose || 'DRIVER_PAYMENT',
                notes: notes || `Payout to driver ${recipientName}`,
                payee: {
                    type: 'UPI',
                    vpa: recipientUpiId,
                    name: recipientName,
                },
            };

            this.logger.log(`Initiating Driver UPI Payout for ${recipientName}`);

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const apiEndpoint = '/pg/v1/payout';
            const checksum = this.generateChecksum(base64Payload, apiEndpoint);

            const response = await axios.post(
                `${this.phonePayBaseUrl}${apiEndpoint}`,
                { request: base64Payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'X-MERCHANT-ID': this.merchantId,
                        accept: 'application/json',
                    },
                    timeout: 15000,
                },
            );

            this.logPayoutResponse(response.data, 'DRIVER_UPI');

            return {
                success: true,
                message: 'Driver payout initiated',
                merchantTransactionId,
                payoutData: response.data,
            };
        } catch (error: any) {
            this.logger.error(`Driver UPI payout error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to process driver payout',
                error.response?.status || 500,
            );
        }
    }

    async payToDriverBank(payoutDto: PayoutRequestDto): Promise<any> {
        try {
            const { amount, recipientAccountNumber, recipientIfscCode, recipientName, purpose, notes } = payoutDto;

            if (!recipientAccountNumber || !recipientIfscCode) {
                throw new Error('Account number and IFSC code are required for bank payout');
            }

            const merchantTransactionId = `driver_bank_payout_${randomUUID()}`;

            const payload = {
                merchantId: this.merchantId,
                merchantTransactionId,
                amount: amount * 100,
                purpose: purpose || 'DRIVER_PAYMENT',
                notes: notes || `Payout to driver ${recipientName}`,
                payee: {
                    type: 'BANK_ACCOUNT',
                    accountNumber: recipientAccountNumber,
                    ifsc: recipientIfscCode,
                    name: recipientName,
                },
            };

            this.logger.log(`Initiating Driver Bank Payout for ${recipientName}`);

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const apiEndpoint = '/v1/disburse/account';
            const checksum = this.generateChecksum(base64Payload, apiEndpoint);

            const response = await axios.post(
                `${this.payoutBaseUrl}${apiEndpoint}`,
                { request: base64Payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'X-MERCHANT-ID': this.merchantId,
                        accept: 'application/json',
                    },
                    timeout: 30000,
                },
            );

            this.logger.log('Driver Bank Payout Success');

            return {
                success: true,
                message: 'Driver bank payout initiated',
                merchantTransactionId,
                payoutData: response.data,
            };
        } catch (error: any) {
            this.logger.error(`Driver bank payout error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to process driver bank payout',
                error.response?.status || 500,
            );
        }
    }

    async checkDriverPayoutStatus(merchantTransactionId: string): Promise<any> {
        try {
            const path = `/pg/v1/payout/status/${this.merchantId}/${merchantTransactionId}`;
            const checksum = this.generateChecksum('', path);

            this.logger.log(`Checking payout status for transaction: ${merchantTransactionId}`);

            const response = await axios.get(`${this.phonePayBaseUrl}${path}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': this.merchantId,
                    accept: 'application/json',
                },
                timeout: 10000,
            });

            this.logger.log(`Driver Payout Status: ${response.data?.data?.status || 'UNKNOWN'}`);

            return {
                success: true,
                statusData: response.data,
            };
        } catch (error: any) {
            this.logger.error(`Driver payout status error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to check driver payout status',
                error.response?.status || 500,
            );
        }
    }

    async createAutoPayMandate(mandateDto: AutoPayMandateDto): Promise<any> {
        try {
            const {
                amount,
                userId,
                frequency,
                startDate,
                endDate,
                recipientUpiId,
                recipientName,
                purpose,
                notes,
                merchantTransactionId,
                callbackUrl,
            } = mandateDto;

            if (!recipientUpiId) {
                throw new Error('UPI ID is required for AutoPay mandate');
            }

            const transactionId = merchantTransactionId || `mandate_${randomUUID()}`;
            const mandateCallbackUrl = callbackUrl || `${this.appBaseUrl}/payment/mandate-callback`;

            const payload = {
                merchantId: this.merchantId,
                merchantTransactionId: transactionId,
                merchantUserId: userId,
                amount: amount * 100,
                recurring: {
                    frequency,
                    startDate,
                    endDate,
                },
                paymentInstrument: {
                    type: 'UPI',
                    vpa: recipientUpiId,
                    name: recipientName,
                },
                purpose: purpose || 'AUTO_PAY_ADMIN_DRIVER',
                notes: notes || `Recurring payment to ${recipientName}`,
                callbackUrl: mandateCallbackUrl,
                redirectUrl: mandateCallbackUrl,
            };

            this.logger.log(`Initiating AutoPay Mandate for ${recipientName} (UPI: ${recipientUpiId})`);
            this.logger.log(`Payload: ${JSON.stringify(payload)}`);

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const apiEndpoint = '/pg/v1/mandate';
            const checksum = this.generateChecksum(base64Payload, apiEndpoint);

            this.logger.log(`Requesting mandate creation at: ${this.phonePayBaseUrl}${apiEndpoint}`);
            this.logger.log(`Checksum: ${checksum}`);

            const response = await axios.post(
                `${this.phonePayBaseUrl}${apiEndpoint}`,
                { request: base64Payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'X-MERCHANT-ID': this.merchantId,
                        accept: 'application/json',
                    },
                    timeout: 15000,
                },
            );

            this.logger.log(`Mandate creation response: ${JSON.stringify(response.data)}`);

            if (response.data.success && response.data.data?.instrumentResponse?.redirectInfo) {
                this.logger.log('AutoPay Mandate initiated successfully');
                return {
                    success: true,
                    message: 'AutoPay mandate initiated',
                    merchantTransactionId: transactionId,
                    mandateId: response.data.data.mandateId,
                    redirectUrl: response.data.data.instrumentResponse.redirectInfo.url,
                };
            } else {
                throw new Error(response.data.message || 'Failed to initiate AutoPay mandate');
            }
        } catch (error: any) {
            this.logger.error(`AutoPay mandate creation error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to initiate AutoPay mandate',
                error.response?.status || 500,
            );
        }
    }

    async checkMandateStatus(merchantTransactionId: string): Promise<any> {
        try {
            const path = `/pg/v1/status/${this.merchantId}/${merchantTransactionId}`;
            const checksum = this.generateChecksum('', path);

            this.logger.log(`Checking mandate status for transaction: ${merchantTransactionId}`);

            const response = await axios.get(`${this.phonePayBaseUrl}${path}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-VERIFY': checksum,
                    'X-MERCHANT-ID': this.merchantId,
                    accept: 'application/json',
                },
                timeout: 10000,
            });

            this.logger.log(`Mandate Status: ${response.data?.data?.status || 'UNKNOWN'}`);

            return {
                success: true,
                statusData: response.data,
            };
        } catch (error: any) {
            this.logger.error(`Mandate status error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to check mandate status',
                error.response?.status || 500,
            );
        }
    }

    async revokeAutoPayMandate(mandateId: string): Promise<any> {
        try {
            const merchantTransactionId = `revoke_${randomUUID()}`;
            const payload = {
                merchantId: this.merchantId,
                mandateId,
                merchantTransactionId,
            };

            this.logger.log(`Initiating AutoPay Mandate Revocation for Mandate ID: ${mandateId}`);

            const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
            const apiEndpoint = '/pg/v1/mandate/revoke';
            const checksum = this.generateChecksum(base64Payload, apiEndpoint);

            const response = await axios.post(
                `${this.phonePayBaseUrl}${apiEndpoint}`,
                { request: base64Payload },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-VERIFY': checksum,
                        'X-MERCHANT-ID': this.merchantId,
                        accept: 'application/json',
                    },
                    timeout: 15000,
                },
            );

            this.logger.log('AutoPay Mandate Revoked Successfully');

            return {
                success: true,
                message: 'AutoPay mandate revoked',
                merchantTransactionId,
                revokeData: response.data,
            };
        } catch (error: any) {
            this.logger.error(`Mandate revocation error: ${error.response?.data || error.message}`);
            throw new HttpException(
                error.response?.data?.message || 'Failed to revoke AutoPay mandate',
                error.response?.status || 500,
            );
        }
    }

    async processMandateCallback(callbackData: { body: any; headers: any }): Promise<{ success: boolean; mandateData?: any }> {
        try {
            this.logger.log('Mandate callback received');
            this.logger.log(`Webhook Body: ${JSON.stringify(callbackData.body)}`);
            this.logger.log(`Webhook Headers: ${JSON.stringify(callbackData.headers)}`);

            const isValid = this.validateCallbackChecksum(callbackData);

            if (!isValid) {
                this.logger.error('Invalid mandate callback checksum');
                return { success: false };
            }

            this.logger.log('Mandate callback checksum validated successfully');

            const responseBuffer = Buffer.from(callbackData.body.response, 'base64');
            const decodedData = JSON.parse(responseBuffer.toString('utf8'));

            this.logMandateDetails(decodedData);

            return {
                success: true,
                mandateData: decodedData,
            };
        } catch (error) {
            this.logger.error(`Error processing mandate callback: ${error}`);
            return { success: false };
        }
    }

    private generateChecksum(base64Payload: string, apiEndpoint: string): string {
        const stringToHash = base64Payload + apiEndpoint + this.saltKey;
        return crypto
            .createHash('sha256')
            .update(stringToHash)
            .digest('hex') + '###' + this.saltIndex;
    }

    private logPaymentDetails(decodedData: any): void {
        const data = decodedData.data;
        const code = decodedData.code;

        this.logger.log('PAYMENT COMPLETION DETAILS');
        this.logger.log(`Transaction Status: ${code}`);
        this.logger.log(`Merchant Transaction ID: ${data.merchantTransactionId}`);
        this.logger.log(`PhonePe Transaction ID: ${data.transactionId}`);
        this.logger.log(`User ID: ${data.merchantUserId}`);
        this.logger.log(`Amount: ₹${data.amount / 100}`);
        this.logger.log(`Transaction Time: ${new Date().toLocaleString()}`);

        if (data.paymentInstrument) {
            this.logger.log(`Payment Method: ${data.paymentInstrument.type}`);
            if (data.paymentInstrument.type === 'UPI') {
                this.logger.log(`UPI Transaction Reference: ${data.paymentInstrument.utr || 'N/A'}`);
                this.logger.log(`UPI ID: ${data.paymentInstrument.upiId || 'N/A'}`);
            }
        }

        this.logger.log(`State: ${data.state}`);
        this.logger.log(`Response Code: ${data.responseCode}`);
        this.logger.log(`Response Message: ${data.responseMessage}`);
    }

    private logPayoutResponse(responseData: any, payoutType: string): void {
        this.logger.log(`${payoutType} Payout Response`);
        this.logger.log(`Success: ${responseData.success}`);
        this.logger.log(`Code: ${responseData.code}`);
        this.logger.log(`Message: ${responseData.message}`);

        if (responseData.data) {
            this.logger.log(`Transaction ID: ${responseData.data.merchantTransactionId}`);
            this.logger.log(`Status: ${responseData.data.status}`);
            this.logger.log(`Amount: ₹${responseData.data.amount / 100}`);
        }
    }

    private logMandateDetails(decodedData: any): void {
        const data = decodedData.data;
        const code = decodedData.code;

        this.logger.log('MANDATE CALLBACK DETAILS');
        this.logger.log(`Mandate Status: ${code}`);
        this.logger.log(`Mandate ID: ${data.mandateId || 'N/A'}`);
        this.logger.log(`Merchant Transaction ID: ${data.merchantTransactionId}`);
        this.logger.log(`User ID: ${data.merchantUserId}`);
        this.logger.log(`Amount: ₹${data.amount / 100}`);
        this.logger.log(`Transaction Time: ${new Date().toLocaleString()}`);
        this.logger.log(`State: ${data.state}`);
        this.logger.log(`Response Code: ${data.responseCode}`);
        this.logger.log(`Response Message: ${data.responseMessage}`);
    }

    private validateCallbackChecksum(callbackData: { body: any; headers: any }): boolean {
        try {
            const callbackChecksum = callbackData.headers?.['x-verify'] || callbackData.headers?.['X-VERIFY'];
            if (!callbackChecksum) {
                this.logger.error('No X-VERIFY header found in callback');
                return false;
            }

            const receivedChecksum = callbackChecksum.split('###')[0];
            const base64Response = callbackData.body.response;
            const stringToHash = base64Response + this.saltKey;
            const generatedChecksum = crypto
                .createHash('sha256')
                .update(stringToHash)
                .digest('hex');

            this.logger.log('Checksum Validation');
            this.logger.log(`Received: ${receivedChecksum.substring(0, 20)}...`);
            this.logger.log(`Generated: ${generatedChecksum.substring(0, 20)}...`);
            this.logger.log(`Match: ${receivedChecksum === generatedChecksum}`);

            return receivedChecksum === generatedChecksum;
        } catch (error) {
            this.logger.error(`Error validating callback checksum: ${error}`);
            return false;
        }
    }
}