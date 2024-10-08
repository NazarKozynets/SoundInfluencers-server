import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({ default: 'stripe' })
  paymentType: string;

  @Prop()
  orderId: string;

  @Prop()
  userId: string;

  @Prop()
  amount: string;

  @Prop({ default: 'wait' })
  statusOrder: string;
  
  @Prop()
  campaignName: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
