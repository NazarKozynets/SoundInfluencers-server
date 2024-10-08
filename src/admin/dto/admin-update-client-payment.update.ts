import {ApiProperty} from "@nestjs/swagger";

export class AdminUpdateClientPayment {
    @ApiProperty({required: true})
    _id: string;
    
    @ApiProperty({required: true})
    orderId: string;

    @ApiProperty({required: true})
    userId: string;
    
    @ApiProperty({required: false})
    campaignName: string;
    
    @ApiProperty({required: false})
    statusOrder: string;
    
    @ApiProperty({required: false})
    amount: string;
    
    @ApiProperty({required: false})
    companyName: string;
}