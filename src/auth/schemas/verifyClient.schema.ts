import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class VerifyClient {
  @Prop()
  clientId: string;

  @Prop()
  verifyId: string;
}

export const VerifyClientSchema = SchemaFactory.createForClass(VerifyClient);
