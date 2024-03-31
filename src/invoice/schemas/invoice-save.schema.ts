import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class SaveInvoiceData {
  @Prop()
  description: string;
  
  @Prop()
  influencerId: string;

  @Prop()
  status: string;

  @Prop()
  payee: string;

  @Prop()
  bankName: string;

  @Prop()
  beneficiary: string;

  @Prop()
  beneficiaryAddress: string;

  @Prop()
  iban: string;

  @Prop()
  bankCountry: string;

  @Prop()
  bankAccountCurrency: string;

  @Prop()
  sortCode: string;

  @Prop()
  accountNumber: string;

  @Prop()
  swiftOrBic: string;

  @Prop()
  contactName: string;

  @Prop()
  contactPhone: string;

  @Prop()
  contactEmail: string;

  @Prop()
  companyName: string;

  @Prop()
  companyId: string;

  @Prop()
  street: string;

  @Prop()
  city: string;

  @Prop()
  state: string;

  @Prop()
  postcode: string;

  @Prop()
  vat: string;

  @Prop()
  country: string;

  @Prop()
  notes: string;

  @Prop()
  amount: number;

  @Prop({ default: '' })
  fileUrl: string;
}

export const SaveInvoiceDataSchema = SchemaFactory.createForClass(SaveInvoiceData);
