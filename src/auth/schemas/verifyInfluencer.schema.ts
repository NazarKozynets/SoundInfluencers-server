import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  timestamps: true,
})
export class VerifyInfluencer {
  @Prop()
  influencerId: string;

  @Prop()
  verifyId: string;
}

export const VerifyInfluencerSchema =
  SchemaFactory.createForClass(VerifyInfluencer);
