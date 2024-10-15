import { ApiProperty } from '@nestjs/swagger';

export class AdminUpdatePromoInfluencersDto {
    @ApiProperty({ required: true })
    promoId: string;
    
    @ApiProperty({required: true})
    instagramUsername: string;
    
    @ApiProperty({required: false})
    datePost: string;
    
    @ApiProperty({required: false})
    impressions: string;

    @ApiProperty({required: false})
    like: string;
    
    @ApiProperty({required: false})
    screenshot: string;
    
    @ApiProperty({required: false})
    postLink: string;
}