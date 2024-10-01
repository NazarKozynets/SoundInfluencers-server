import {ApiProperty} from '@nestjs/swagger';

export class AdminUpdatePersonalClientDto {
    @ApiProperty({required: true})
    id: string;

    @ApiProperty({required: false})
    firstName: string;

    @ApiProperty({required: false})
    company: string;

    @ApiProperty({required: false})
    email: string;

    @ApiProperty({ required: false })
    phone: string;
    
    @ApiProperty({ required: false })
    companyType: string;
    
    @ApiProperty({ required: false })
    balance: number;
    
    @ApiProperty({ required: false })
    internalNote: string;
}
