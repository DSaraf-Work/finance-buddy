// AI-Powered Transaction Extractor

import { getAIManager } from '../../ai/manager';
import { 
  TransactionExtractionRequest, 
  ExtractedTransaction, 
  TransactionExtractionResponse 
} from '../../ai/types';
import { 
  TRANSACTION_EXTRACTION_SYSTEM_PROMPT,
  TRANSACTION_EXTRACTION_USER_PROMPT,
  CATEGORY_CLASSIFICATION_PROMPT,
  MERCHANT_NORMALIZATION_PROMPT,
  BANK_TRANSACTION_PROMPT,
  CREDIT_CARD_PROMPT,
  PAYMENT_APP_PROMPT,
  SUBSCRIPTION_PROMPT
} from '../prompts/transaction-extraction';
import { TASK_CONFIGS } from '../../ai/config';

export class TransactionExtractor {
  private aiManager = getAIManager();
  private readonly EXTRACTION_VERSION = '1.0.0';

  async extractTransaction(request: TransactionExtractionRequest): Promise<TransactionExtractionResponse> {
    const startTime = Date.now();

    try {
      console.log('🔍 Starting transaction extraction:', {
        emailId: request.emailId,
        subject: request.subject,
        fromAddress: request.fromAddress,
        bodyLength: request.plainBody?.length || 0,
        hasSnippet: !!request.snippet,
        internalDate: request.internalDate?.toISOString(),
      });

      console.log('📧 Email content preview:', {
        emailId: request.emailId,
        subjectPreview: request.subject?.substring(0, 100) + '...',
        fromAddress: request.fromAddress,
        bodyPreview: request.plainBody?.substring(0, 200) + '...',
        snippetPreview: request.snippet?.substring(0, 100) + '...',
        hasPlainBody: !!request.plainBody,
        hasSnippet: !!request.snippet,
        contentSource: request.plainBody ? 'plain_body' : (request.snippet ? 'snippet' : 'none'),
      });

      // If plain_body is empty but we have a snippet, use the snippet as content
      if (!request.plainBody && request.snippet) {
        console.log('⚠️ Plain body is empty, using snippet as content source');
        request.plainBody = request.snippet;
      }

      if (!request.plainBody && !request.snippet) {
        console.error('❌ No email content available (neither plain_body nor snippet)');
        return {
          success: false,
          error: 'No email content available for processing',
          modelUsed: 'none',
          processingTime: Date.now() - startTime,
        };
      }

      // Step 1: Extract basic transaction information
      console.log('🤖 Step 1: Performing basic AI extraction...');
      const extractionResult = await this.performBasicExtraction(request);

      if (!extractionResult.success || !extractionResult.transaction) {
        console.error('❌ Basic extraction failed:', {
          emailId: request.emailId,
          error: extractionResult.error,
          modelUsed: extractionResult.modelUsed,
        });
        return {
          success: false,
          error: extractionResult.error || 'Failed to extract transaction',
          modelUsed: extractionResult.modelUsed || 'unknown',
          processingTime: Date.now() - startTime,
        };
      }

      console.log('✅ Basic extraction successful:', {
        emailId: request.emailId,
        modelUsed: extractionResult.modelUsed,
        initialConfidence: extractionResult.transaction.confidence,
        extractedFields: {
          amount: extractionResult.transaction.amount,
          currency: extractionResult.transaction.currency,
          merchantName: extractionResult.transaction.merchantName,
          direction: extractionResult.transaction.direction,
          txnTime: extractionResult.transaction.txnTime?.toISOString(),
        }
      });

      let transaction = extractionResult.transaction;

      // Step 2: Enhance with specialized extraction if needed
      console.log('🔧 Step 2: Enhancing with specialized extraction...');
      transaction = await this.enhanceWithSpecializedExtraction(request, transaction);

      // Step 3: Normalize merchant name if present
      if (transaction.merchantName) {
        console.log('🏪 Step 3: Normalizing merchant name:', transaction.merchantName);
        transaction.merchantNormalized = await this.normalizeMerchantName(transaction.merchantName);
        console.log('✅ Merchant normalized:', {
          original: transaction.merchantName,
          normalized: transaction.merchantNormalized,
        });
      } else {
        console.log('⚠️ Step 3: No merchant name to normalize');
      }

      // Step 4: Classify category if not already determined
      if (!transaction.category && transaction.merchantName) {
        console.log('📂 Step 4: Classifying transaction category...');
        transaction.category = await this.classifyCategory(
          transaction.merchantName,
          request.plainBody
        );
        console.log('✅ Category classified:', transaction.category);
      } else {
        console.log('⚠️ Step 4: Category already determined or no merchant name:', transaction.category);
      }

      // Step 5: Final validation and confidence adjustment
      console.log('🔍 Step 5: Final validation and confidence adjustment...');
      const originalConfidence = transaction.confidence;
      transaction = this.validateAndAdjustConfidence(transaction);
      console.log('✅ Confidence adjusted:', {
        original: originalConfidence,
        adjusted: transaction.confidence,
        confidenceChange: transaction.confidence - originalConfidence,
      });

      console.log('🎉 Transaction extraction completed successfully:', {
        emailId: request.emailId,
        finalTransaction: {
          amount: transaction.amount,
          currency: transaction.currency,
          direction: transaction.direction,
          merchantName: transaction.merchantName,
          merchantNormalized: transaction.merchantNormalized,
          category: transaction.category,
          txnTime: transaction.txnTime?.toISOString(),
          accountHint: transaction.accountHint,
          referenceId: transaction.referenceId,
          location: transaction.location,
          confidence: transaction.confidence,
        },
        processingTime: Date.now() - startTime,
        modelUsed: extractionResult.modelUsed,
      });

      return {
        success: true,
        transaction,
        modelUsed: extractionResult.modelUsed,
        processingTime: Date.now() - startTime,
      };

    } catch (error: any) {
      console.error('❌ Transaction extraction failed:', error);
      
      return {
        success: false,
        error: error.message || 'Unknown extraction error',
        modelUsed: 'unknown',
        processingTime: Date.now() - startTime,
      };
    }
  }

  private async performBasicExtraction(request: TransactionExtractionRequest): Promise<{
    success: boolean;
    transaction?: ExtractedTransaction;
    error?: string;
    modelUsed: string;
  }> {
    try {
      console.log('🤖 Preparing AI extraction request:', {
        emailId: request.emailId,
        emailType: this.detectEmailType(request.fromAddress),
      });

      const systemPrompt = this.getSystemPrompt(request);
      const userPrompt = TRANSACTION_EXTRACTION_USER_PROMPT(request);

      console.log('📝 AI Prompts prepared:', {
        emailId: request.emailId,
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
        taskConfig: TASK_CONFIGS.transaction_extraction,
      });

      console.log('🔗 Sending request to AI manager...');
      const response = await this.aiManager.generateResponse({
        systemPrompt,
        prompt: userPrompt,
        ...TASK_CONFIGS.transaction_extraction,
      });

      console.log('✅ AI response received:', {
        emailId: request.emailId,
        model: response.model,
        provider: response.provider,
        contentLength: response.content.length,
        usage: response.usage,
      });

      // Parse the JSON response
      console.log('🔍 Parsing AI response as JSON:', {
        emailId: request.emailId,
        responsePreview: response.content.substring(0, 200) + '...',
      });

      let extractedData;
      try {
        extractedData = JSON.parse(response.content);
        console.log('✅ JSON parsing successful:', {
          emailId: request.emailId,
          extractedFields: Object.keys(extractedData),
          rawData: extractedData,
        });
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', {
          emailId: request.emailId,
          error: parseError,
          responseContent: response.content,
        });
        throw new Error(`Failed to parse AI response as JSON: ${parseError}`);
      }

      // Convert to our transaction format
      console.log('🔄 Converting to transaction format...');
      const transaction: ExtractedTransaction = {
        txnTime: extractedData.txnTime ? new Date(extractedData.txnTime) : undefined,
        amount: extractedData.amount,
        currency: extractedData.currency,
        direction: extractedData.direction,
        merchantName: extractedData.merchantName,
        merchantNormalized: extractedData.merchantNormalized,
        category: extractedData.category,
        accountHint: extractedData.accountHint,
        referenceId: extractedData.referenceId,
        location: extractedData.location,
        confidence: extractedData.confidence || 0.5,
        extractionVersion: this.EXTRACTION_VERSION,
        rawExtraction: extractedData,
      };

      console.log('✅ Transaction format conversion complete:', {
        emailId: request.emailId,
        transactionSummary: {
          hasAmount: !!transaction.amount,
          hasMerchant: !!transaction.merchantName,
          hasDate: !!transaction.txnTime,
          confidence: transaction.confidence,
        },
      });

      return {
        success: true,
        transaction,
        modelUsed: response.model,
      };

    } catch (error: any) {
      console.error('Basic extraction failed:', error);
      
      return {
        success: false,
        error: error.message,
        modelUsed: error.model || 'unknown',
      };
    }
  }

  private getSystemPrompt(request: TransactionExtractionRequest): string {
    const fromAddress = request.fromAddress.toLowerCase();
    
    // Determine email type and use specialized prompt
    if (this.isBankEmail(fromAddress)) {
      return TRANSACTION_EXTRACTION_SYSTEM_PROMPT + '\n\n' + BANK_TRANSACTION_PROMPT;
    } else if (this.isCreditCardEmail(fromAddress)) {
      return TRANSACTION_EXTRACTION_SYSTEM_PROMPT + '\n\n' + CREDIT_CARD_PROMPT;
    } else if (this.isPaymentAppEmail(fromAddress)) {
      return TRANSACTION_EXTRACTION_SYSTEM_PROMPT + '\n\n' + PAYMENT_APP_PROMPT;
    } else if (this.isSubscriptionEmail(fromAddress)) {
      return TRANSACTION_EXTRACTION_SYSTEM_PROMPT + '\n\n' + SUBSCRIPTION_PROMPT;
    }
    
    return TRANSACTION_EXTRACTION_SYSTEM_PROMPT;
  }

  private async enhanceWithSpecializedExtraction(
    request: TransactionExtractionRequest, 
    transaction: ExtractedTransaction
  ): Promise<ExtractedTransaction> {
    // If confidence is low, try specialized extraction
    if (transaction.confidence < 0.7) {
      // Could implement additional specialized extraction logic here
      // For now, just return the original transaction
    }
    
    return transaction;
  }

  private async normalizeMerchantName(merchantName: string): Promise<string> {
    try {
      const response = await this.aiManager.generateResponse({
        prompt: MERCHANT_NORMALIZATION_PROMPT(merchantName),
        ...TASK_CONFIGS.merchant_normalization,
      });
      
      return response.content.trim();
    } catch (error) {
      console.warn('Merchant normalization failed, using original:', error);
      return merchantName;
    }
  }

  private async classifyCategory(merchantName: string, transactionDetails: string): Promise<string> {
    try {
      const response = await this.aiManager.generateResponse({
        prompt: CATEGORY_CLASSIFICATION_PROMPT(merchantName, transactionDetails),
        ...TASK_CONFIGS.category_classification,
      });
      
      return response.content.trim().toLowerCase();
    } catch (error) {
      console.warn('Category classification failed:', error);
      return 'other';
    }
  }

  private validateAndAdjustConfidence(transaction: ExtractedTransaction): ExtractedTransaction {
    let confidence = transaction.confidence;
    
    // Adjust confidence based on available fields
    const fieldWeights = {
      amount: 0.3,
      merchantName: 0.2,
      txnTime: 0.15,
      currency: 0.1,
      direction: 0.1,
      referenceId: 0.1,
      category: 0.05,
    };
    
    let weightedScore = 0;
    let totalWeight = 0;
    
    for (const [field, weight] of Object.entries(fieldWeights)) {
      if (transaction[field as keyof ExtractedTransaction]) {
        weightedScore += weight;
      }
      totalWeight += weight;
    }
    
    const fieldBasedConfidence = weightedScore / totalWeight;
    
    // Use the lower of AI confidence and field-based confidence
    confidence = Math.min(confidence, fieldBasedConfidence);
    
    // Ensure confidence is within valid range
    confidence = Math.max(0, Math.min(1, confidence));
    
    return {
      ...transaction,
      confidence,
    };
  }

  // Email type detection helpers
  private detectEmailType(fromAddress: string): string {
    if (this.isBankEmail(fromAddress)) return 'bank';
    if (this.isCreditCardEmail(fromAddress)) return 'credit_card';
    if (this.isPaymentAppEmail(fromAddress)) return 'payment_app';
    if (this.isSubscriptionEmail(fromAddress)) return 'subscription';
    return 'generic';
  }

  private isBankEmail(fromAddress: string): boolean {
    const bankDomains = [
      'chase.com', 'bankofamerica.com', 'wellsfargo.com', 'citibank.com',
      'usbank.com', 'pnc.com', 'capitalone.com', 'ally.com',
      'icicibank.com', 'hdfcbank.com', 'sbi.co.in', 'axisbank.com'
    ];
    
    return bankDomains.some(domain => fromAddress.includes(domain));
  }

  private isCreditCardEmail(fromAddress: string): boolean {
    const cardDomains = [
      'visa.com', 'mastercard.com', 'americanexpress.com', 'discover.com',
      'chase.com', 'citi.com', 'capitalone.com'
    ];
    
    return cardDomains.some(domain => fromAddress.includes(domain));
  }

  private isPaymentAppEmail(fromAddress: string): boolean {
    const paymentDomains = [
      'paypal.com', 'venmo.com', 'cashapp.com', 'zelle.com',
      'googlepay.com', 'apple.com', 'paytm.com', 'phonepe.com'
    ];
    
    return paymentDomains.some(domain => fromAddress.includes(domain));
  }

  private isSubscriptionEmail(fromAddress: string): boolean {
    const subscriptionDomains = [
      'netflix.com', 'spotify.com', 'amazon.com', 'apple.com',
      'google.com', 'microsoft.com', 'adobe.com'
    ];
    
    return subscriptionDomains.some(domain => fromAddress.includes(domain));
  }
}
