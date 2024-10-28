import { ApiProperty } from '@nestjs/swagger';

export class AdminPutOfferToOffersDto {
    @ApiProperty()
    _id: string;
    
    @ApiProperty()
    id: number;

    @ApiProperty()
    price: number;

    @ApiProperty()
    followers: string;

    @ApiProperty()
    network: string;

    @ApiProperty()
    story: string;

    @ApiProperty()
    maxInfluencer: number;

    @ApiProperty()
    connectInfluencer: [];

    @ApiProperty()
    musicStyles: any[];
    
    @ApiProperty({required: false})
    wasPublished: boolean;
}