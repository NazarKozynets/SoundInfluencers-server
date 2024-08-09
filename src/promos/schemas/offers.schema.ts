import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

export interface MusicStyle {
  price: number;
  genres: string[]; 
}

@Schema()
export class MusicStyleSchema {
  @Prop()
  price: number;

  @Prop({ type: [String] }) 
  genres: string[];
}

export const MusicStyleSchemaSchema = SchemaFactory.createForClass(MusicStyleSchema);

@Schema({
  timestamps: true,
})
export class Offers {
  @Prop()
  id: number;

  @Prop()
  price: number;

  @Prop()
  maxInfluencer: number;
  
  @Prop()
  connectInfluencer: [];

  @Prop({ type: [MusicStyleSchemaSchema] })
  musicStyles: MusicStyle[];
}

export const OffersSchema = SchemaFactory.createForClass(Offers);