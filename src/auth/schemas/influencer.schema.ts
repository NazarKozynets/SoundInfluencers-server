import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';

interface typesInstagram {
  musicStyle: string;
  instagramUsername: string;
  instagramLink: string,
  followersNumber: string;
  logo: string;
  price: string;
}

const typesInstagramApi = {
  musicStyle: String,
  instagramUsername: String,
  instagramLink: String,
  followersNumber: String,
  logo: String,
  price: String,
};

@Schema({
  timestamps: true,
})
export class Influencer {
  @Prop({ default: 'influencer' })
  role: string;

  @Prop({ default: 0 })
  balance: string;

  @Prop()
  firstName: string;

  @Prop({ type: [typesInstagramApi] })
  instagram: typesInstagram[];
  @Prop({ type: [typesInstagramApi] })
  tiktok: typesInstagram[];
  @Prop({ type: [typesInstagramApi] })
  spotify: typesInstagram[];
  @Prop({ type: [typesInstagramApi] })
  press: typesInstagram[];
  @Prop({ type: [typesInstagramApi] })
  soundcloud: typesInstagram[];
  @Prop({ type: [typesInstagramApi] })
  facebook: typesInstagram[];

  @Prop()
  followersNumber: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  password: string;

  @Prop({ default: 'wait' })
  statusVerify: string;
}

export const InfluencerSchema = SchemaFactory.createForClass(Influencer);
