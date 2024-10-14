import {ApiProperty} from "@nestjs/swagger";

export class AdminUpdatePromoDto {
    @ApiProperty({required: true})
    _id: string;
    
    @ApiProperty({required: false})
    userId: string;

    @ApiProperty({required: false})
    replacementsNotes: string;
    
    @ApiProperty({required: false})
    partialRefund: number;
}
