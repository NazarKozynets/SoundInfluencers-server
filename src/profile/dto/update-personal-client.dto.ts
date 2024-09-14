import {ApiProperty} from '@nestjs/swagger';

export class UpdatePersonalClientDto {
    @ApiProperty({required: true})
    id: string;

    @ApiProperty({required: true})
    firstName: string;

    @ApiProperty({required: true})
    company: string;
    
    @ApiProperty({required: true})
    email: string;

    @ApiProperty({ required: true })
    phone: string;
}
