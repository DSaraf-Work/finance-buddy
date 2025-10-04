// Schema-Aware AI Transaction Extractor
// This system tells the AI about the database schema and lets it extract values intelligently

import { getAIManager } from '../manager';
import { AIRequest } from '../types';

export interface TransactionSchema {
  txn_time: {
    type: 'timestamp';
    description: 'Transaction date and time (ISO format)';
    example: '2025-10-03T15:30:00Z';
  };
  amount: {
    type: 'numeric';
    description: 'Transaction amount (positive number, no currency symbols)';
    example: 1250.00;
  };
  currency: {
    type: 'text';
    description: 'Currency code';
    example: 'INR';
    default: 'INR';
  };
  direction: {
    type: 'text';
    description: 'Transaction direction';
    enum: ['debit', 'credit'];
    example: 'debit';
  };
  merchant_name: {
    type: 'text';
    description: 'Merchant or payee name as mentioned in the transaction';
    example: 'Swiggy Food Delivery';
  };
  merchant_normalized: {
    type: 'text';
    description: 'Normalized/simplified merchant name';
    example: 'Swiggy';
  };
  category: {
    type: 'text';
    description: 'Transaction category';
    enum: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'finance', 'other'];
    example: 'food';
  };
  account_hint: {
    type: 'text';
    description: 'Last 4 digits of account number (if mentioned)';
    example: '4277';
  };
  reference_id: {
    type: 'text';
    description: 'Transaction reference ID or number';
    example: 'TXN123456';
  };
  location: {
    type: 'text';
    description: 'Transaction location (if mentioned)';
    example: 'Mumbai, India';
  };
  account_type: {
    type: 'text';
    description: 'Type of account based on bank and card details';
    enum: [
      'DCB_4277', 'HDFC_SWIGGY_7712', 'HDFC_DEBIT', 'HDFC_CREDIT',
      'ICICI_DEBIT', 'ICICI_CREDIT', 'SBI_DEBIT', 'SBI_CREDIT', 'OTHER'
    ];
    example: 'HDFC_SWIGGY_7712';
  };
  transaction_type: {
    type: 'text';
    description: 'Transaction type abbreviation';
    enum: ['Dr', 'Cr'];
    example: 'Dr';
  };
  ai_notes: {
    type: 'text';
    description: 'Comma-separated keywords describing the transaction';
    example: 'payment, expense, dining, food, delivery, online';
  };
  confidence: {
    type: 'numeric';
    description: 'AI confidence score (0.0 to 1.0)';
    example: 0.95;
  };
}

export class SchemaAwareTransactionExtractor {
  private aiManager: any;
  private schema: TransactionSchema;

  constructor() {
    this.aiManager = getAIManager();

    this.schema = {
      txn_time: {
        type: 'timestamp',
        description: 'Transaction date and time (ISO format)',
        example: '2025-10-03T15:30:00Z'
      },
      amount: {
        type: 'numeric',
        description: 'Transaction amount (positive number, no currency symbols)',
        example: 1250.00
      },
      currency: {
        type: 'text',
        description: 'Currency code',
        example: 'INR',
        default: 'INR'
      },
      direction: {
        type: 'text',
        description: 'Transaction direction',
        enum: ['debit', 'credit'],
        example: 'debit'
      },
      merchant_name: {
        type: 'text',
        description: 'Merchant or payee name as mentioned in the transaction',
        example: 'Swiggy Food Delivery'
      },
      merchant_normalized: {
        type: 'text',
        description: 'Normalized/simplified merchant name',
        example: 'Swiggy'
      },
      category: {
        type: 'text',
        description: 'Transaction category',
        enum: ['food', 'transport', 'shopping', 'bills', 'entertainment', 'health', 'education', 'travel', 'finance', 'other'],
        example: 'food'
      },
      account_hint: {
        type: 'text',
        description: 'Last 4 digits of account number (if mentioned)',
        example: '4277'
      },
      reference_id: {
        type: 'text',
        description: 'Transaction reference ID or number',
        example: 'TXN123456'
      },
      location: {
        type: 'text',
        description: 'Transaction location (if mentioned)',
        example: 'Mumbai, India'
      },
      account_type: {
        type: 'text',
        description: 'Type of account based on bank and card details',
        enum: [
          'DCB_4277', 'HDFC_SWIGGY_7712', 'HDFC_DEBIT', 'HDFC_CREDIT',
          'ICICI_DEBIT', 'ICICI_CREDIT', 'SBI_DEBIT', 'SBI_CREDIT', 'OTHER'
        ],
        example: 'HDFC_SWIGGY_7712'
      },
      transaction_type: {
        type: 'text',
        description: 'Transaction type abbreviation',
        enum: ['Dr', 'Cr'],
        example: 'Dr'
      },
      ai_notes: {
        type: 'text',
        description: 'Comma-separated keywords describing the transaction',
        example: 'payment, expense, dining, food, delivery, online'
      },
      confidence: {
        type: 'numeric',
        description: 'AI confidence score (0.0 to 1.0)',
        example: 0.95
      }
    } as TransactionSchema;
  }

  async extractTransaction(emailContent: string, emailMetadata?: any): Promise<any> {
    console.log('🧠 Schema-Aware AI Extraction Starting...');

    // Log the input email content being analyzed
    console.log('📧 EMAIL INPUT ANALYSIS:');
    console.log('='.repeat(80));
    console.log('Email ID:', emailMetadata?.emailId || 'unknown');
    console.log('Subject:', emailMetadata?.subject || 'N/A');
    console.log('From Address:', emailMetadata?.fromAddress || 'N/A');
    console.log('Plain Body Length:', emailContent?.length || 0);
    console.log('Plain Body Content:', emailContent || 'NULL/EMPTY');
    console.log('Snippet:', emailMetadata?.snippet || 'N/A');
    console.log('Internal Date:', emailMetadata?.internalDate || 'N/A');
    console.log('='.repeat(80));

    // Create a comprehensive prompt that tells the AI about the schema
    const prompt = this.createSchemaAwarePrompt(emailContent, emailMetadata);

    console.log('📋 AI Prompt Preview:', prompt.substring(0, 200) + '...');
    console.log('📋 FULL AI PROMPT:');
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80));

    try {
      // Call the AI Manager with the schema-aware prompt (includes automatic retries and fallbacks)
      const aiRequest: AIRequest = {
        prompt,
        systemPrompt: 'You are a financial transaction extraction AI. Extract transaction data from email content and return valid JSON matching the provided schema.',
        responseFormat: 'json',
        temperature: 0.1,
        maxTokens: 1000,
        metadata: {
          ...emailMetadata,
          emailId: emailMetadata?.emailId || 'unknown',
          subject: emailMetadata?.subject || '',
          fromAddress: emailMetadata?.fromAddress || '',
          content: emailContent,
          snippet: emailMetadata?.snippet || '',
          extractionType: 'schema-aware-transaction',
          schemaVersion: '2.0.0'
        }
      };

      console.log('🤖 Calling AI Manager with automatic retries and fallbacks...');
      console.log('🔍 AI Manager details:', {
        managerExists: !!this.aiManager,
        requestPreview: {
          promptLength: aiRequest.prompt.length,
          systemPromptLength: aiRequest.systemPrompt?.length,
          responseFormat: aiRequest.responseFormat,
          temperature: aiRequest.temperature,
          maxTokens: aiRequest.maxTokens
        }
      });

      const aiResponse = await this.aiManager.generateResponse(aiRequest);

      if (!aiResponse || !aiResponse.content) {
        throw new Error('AI response was empty after all retries');
      }

      console.log('✅ AI Response received:', {
        model: aiResponse.model,
        provider: aiResponse.provider,
        contentLength: aiResponse.content.length,
        usage: aiResponse.usage
      });

      console.log('📋 FULL AI RESPONSE:');
      console.log('='.repeat(80));
      console.log(aiResponse.content);
      console.log('='.repeat(80));

      // Parse the AI response
      let extractedData;
      try {
        extractedData = JSON.parse(aiResponse.content);
        console.log('📊 PARSED AI RESPONSE:');
        console.log('='.repeat(80));
        console.log(JSON.stringify(extractedData, null, 2));
        console.log('='.repeat(80));
      } catch (error) {
        console.error('❌ Failed to parse AI response:', error);
        console.error('Raw AI response:', aiResponse.content);
        throw new Error('Failed to parse AI response as JSON');
      }

      // Validate the extracted data has required fields
      if (!extractedData || typeof extractedData !== 'object') {
        throw new Error('AI response is not a valid object');
      }

      console.log('✅ Schema-Aware Extraction Complete:', {
        amount: extractedData.amount,
        merchant: extractedData.merchant_name,
        accountType: extractedData.account_type,
        confidence: extractedData.confidence,
        model: aiResponse.model,
        provider: aiResponse.provider
      });

      return extractedData;

    } catch (error: any) {
      console.error('❌ AI extraction failed after trying all available models:', {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        name: error.name,
        cause: error.cause
      });

      // Re-throw the error with more context - no fallbacks
      throw new Error(`AI extraction failed: ${error.message}. Please check your AI model configuration and API keys.`);
    }
  }



  private createSchemaAwarePrompt(emailContent: string, emailMetadata?: any): string {
    const schemaDescription = this.generateSchemaDescription();
    
    return `You are an AI transaction extractor. Your task is to extract transaction information from email content and return it as JSON matching the exact schema provided.

EMAIL CONTENT TO ANALYZE:
"""
${emailContent}
"""

EMAIL METADATA:
Subject: ${emailMetadata?.subject || 'N/A'}
From: ${emailMetadata?.fromAddress || 'N/A'}

REQUIRED OUTPUT SCHEMA:
${schemaDescription}

EXTRACTION RULES:
1. Extract ALL fields that can be determined from the email content
2. Use null for fields that cannot be determined
3. Follow the exact field names and types specified in the schema
4. For enum fields, use only the values listed in the enum array
5. For amounts, extract only the numeric value (no currency symbols)
6. For dates, use ISO format (YYYY-MM-DDTHH:MM:SSZ)
7. Be intelligent about account_type - infer from bank name and card details
8. Set confidence based on how clear the information is in the email

IMPORTANT: Return ONLY valid JSON matching the schema. No additional text or explanation.

JSON Response:`;
  }

  private generateSchemaDescription(): string {
    let description = '{\n';
    
    Object.entries(this.schema).forEach(([fieldName, fieldConfig]) => {
      description += `  "${fieldName}": {\n`;
      description += `    "type": "${fieldConfig.type}",\n`;
      description += `    "description": "${fieldConfig.description}",\n`;
      
      if ('enum' in fieldConfig) {
        description += `    "allowed_values": ${JSON.stringify(fieldConfig.enum)},\n`;
      }
      
      if ('default' in fieldConfig) {
        description += `    "default": "${fieldConfig.default}",\n`;
      }
      
      description += `    "example": ${JSON.stringify(fieldConfig.example)}\n`;
      description += '  },\n';
    });
    
    description = description.slice(0, -2) + '\n}'; // Remove last comma
    return description;
  }

}
