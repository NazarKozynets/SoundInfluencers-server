import {Schema, Prop, SchemaFactory} from '@nestjs/mongoose';
import {Document} from 'mongoose';

interface typesInstagram {
    musicStyle: string;
    musicSubStyles: string[] | null;
    musicStyleOther: string[] | null;
    instagramUsername: string;
    instagramLink: string;
    followersNumber: string;
    logo: string;
    price: string;
    countries: { country: string; percentage: number }[];
}

const typesInstagramApi = {
    musicStyle: String,
    musicSubStyles: [String] || null,
    musicStyleOther: [String] || null,
    instagramUsername: String,
    instagramLink: String,
    followersNumber: String,
    logo: String,
    price: String,
    countries: [
        {
            country: String,
            percentage: Number,
        },
    ],
};

@Schema({
    timestamps: true,
})
export class Influencer extends Document {
    @Prop({default: 'influencer'})
    role: string;

    @Prop({default: 0})
    balance: string;

    @Prop()
    firstName: string;

    @Prop({type: [typesInstagramApi]})
    instagram: typesInstagram[];

    // @Prop({ type: [typesInstagramApi] })
    // tiktok: typesInstagram[];
    //
    // @Prop({ type: [typesInstagramApi] })
    // spotify: typesInstagram[];
    //
    // @Prop({ type: [typesInstagramApi] })
    // press: typesInstagram[];
    //
    // @Prop({ type: [typesInstagramApi] })
    // soundcloud: typesInstagram[];
    //
    // @Prop({ type: [typesInstagramApi] })
    // facebook: typesInstagram[];

    @Prop()
    followersNumber: string;

    @Prop()
    email: string;

    @Prop()
    phone: string;

    @Prop()
    password: string;

    @Prop({default: 'wait'})
    statusVerify: string;
}

export const InfluencerSchema = SchemaFactory.createForClass(Influencer);
