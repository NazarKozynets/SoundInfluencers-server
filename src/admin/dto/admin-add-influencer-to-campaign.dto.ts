import {ApiProperty} from '@nestjs/swagger';
import {Prop} from "@nestjs/mongoose";

export class AdminAddInfluencerToCampaignDto {
    @Prop()
    _id: string;

    @Prop()
    influencerId: string;

    @Prop()
    amount: number;

    @Prop()
    instagramUsername: string;

    @Prop({default: 'wait'})
    confirmation: string;

    @Prop()
    selectedVideo: string;

    @Prop()
    dateRequest: string;

    @Prop({ default: 'wait' })
    closePromo: string;

    @Prop({ default: '' })
    brand: string;

    @Prop({ default: '' })
    datePost: string;

    @Prop({ default: '' })
    caption: string;

    @Prop({ default: '' })
    video: string;

    @Prop({ default: '' })
    postLink: string;

    @Prop({ default: '' })
    screenshot: string;

    @Prop({ default: '' })
    impressions: string;

    @Prop({ default: '' })
    reach: string;

    @Prop({ default: '' })
    like: string;

    @Prop({ default: '' })
    invoice: string;
}
