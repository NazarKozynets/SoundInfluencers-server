import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class InvoiceDetails {
  @Prop()
  id: string;
  
  @Prop()
  userId: string;

  @Prop()
  firstName: string;

  @Prop()
  lastName: string;

  @Prop()
  address: string;

  @Prop()
  country: string;

  @Prop()
  vatNumber: string;
  
  @Prop()
  company: string;
}

export const InvoiceDetailsSchema =
  SchemaFactory.createForClass(InvoiceDetails);
