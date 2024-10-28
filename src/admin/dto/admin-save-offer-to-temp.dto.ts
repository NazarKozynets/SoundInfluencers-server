import { ApiProperty } from '@nestjs/swagger';

export class AdminSaveOffersToTempDto {
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

    @ApiProperty({required: true})
    isDeleted: boolean; 

    @ApiProperty({required: true})
    isNew: boolean;

    @ApiProperty({required: true})
    isUpdated: boolean;
}