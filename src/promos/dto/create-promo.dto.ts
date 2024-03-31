import { ApiProperty } from '@nestjs/swagger';
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
}

export class CreatePromosDto {
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
  @ApiProperty({
    required: true,
    type: 'array',
    items: {
      type: 'object',
    },
  })
  selectInfluencers: selectInfluencersType[];

  @ApiProperty({ required: true })
  videoLink: string;

  @ApiProperty({ required: true })
  postDescription: string;

  @ApiProperty({ required: true })
  storyTag: string;

  @ApiProperty({ required: true })
  swipeUpLink: string;

  @ApiProperty({ required: true })
  dateRequest: string;

  @ApiProperty({ required: true })
  specialWishes: string;

  @ApiProperty({ required: true, default: 'payment' })
  paymentType: string;

  @ApiProperty({ required: true, default: 'wait' })
  paymentStatus: string;

  @ApiProperty({ required: true })
  amount: number;
}
