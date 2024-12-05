import {ApiProperty} from '@nestjs/swagger';

export class UpdateSocialMediaAccountDto {
    @ApiProperty({required: true})
    _id: string;
    
    @ApiProperty({required: true})
    typeOfSocialMedia: string;
    
    @ApiProperty({required: true})
    accountId: string;

    @ApiProperty({required: true})
    instagramUsername: string;
    
    @ApiProperty({required: true})
    instagramLink: string;
    
    @ApiProperty({required: true})
    followersNumber: string;
    
    @ApiProperty({required: true})
    logo: string;
    
    @ApiProperty({required: true})
    price: string;
    
    @ApiProperty({required: true})
    publicPrice: string;
    
    @ApiProperty({required: true})
    musicStyle: string;
    
    @ApiProperty({required: true})
    musicSubStyles: string[];
    
    @ApiProperty({required: true})
    musicStyleOther: string[];
    
    @ApiProperty({required: true})
    countries: { country: string; percentage: number }[];
    
    @ApiProperty({required: true})
    categories: string[];
}
