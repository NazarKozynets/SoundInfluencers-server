import { ApiProperty } from '@nestjs/swagger';

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
}

export class CreatePromosEstimateDto {
    @ApiProperty({ required: true })
    userId: string;

    @ApiProperty({
        required: true,
        type: 'object',
        properties: {
            variant: { type: 'number' },
            price: { type: 'number' },
        },
    })
    selectPrice: {
        variant: number;
        price: number;
    };

    @ApiProperty({ required: true, default: 'payment' })
    paymentType: string;

    @ApiProperty({ required: true, default: 'wait' })
    paymentStatus: string;
    
    @ApiProperty({
        required: true,
        type: 'array',
        items: {
            type: 'object',
        },
    })
    selectInfluencers: selectInfluencersType[];
}