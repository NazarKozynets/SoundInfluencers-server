import {ApiProperty} from '@nestjs/swagger';
import mongoose from 'mongoose';

interface selectInfluencersType {
    influencerId: string;
    instagramUsername: string;
    confirmation: string;
    brand: string;
    datePost: string;
    caption: string;
    video: string;
    postLink: string;
    screenshot: string;
    impressions: string;
    reach: string;
    like: string;
    invoice: string;
    selectedVideo: string;
    dateRequest: string;
}


interface VideoType {
    videoLink: string;
    postDescription: string;
    storyTag: string;
    swipeUpLink: string;
    specialWishes: string;
}

export class CreatePromosDto {
    @ApiProperty({required: true})
    userId: string;

    @ApiProperty({
        required: true,
        type: 'object',
        properties: {
            variant: {type: 'number'},
            price: {type: 'number'},
        },
    })
    selectPrice: {
        variant: number;
        price: number;
    };

    @ApiProperty({
        required: true,
        type: 'array',
        items: {
            type: 'object',
        },
    })
    selectInfluencers: selectInfluencersType[];

    @ApiProperty({
        required: true,
        type: 'array',
        items: {
            type: 'object',
        },
    })
    videos: VideoType[];

    @ApiProperty({required: true})
    campaignName: string;

    @ApiProperty({required: true})
    paymentType: string;

    @ApiProperty({required: true, default: 'wait'})
    paymentStatus: string;

    @ApiProperty({required: true})
    amount: number;

    @ApiProperty({required: true})
    createdAt: string;

    @ApiProperty({required: true})
    socialMedia: string;
}
