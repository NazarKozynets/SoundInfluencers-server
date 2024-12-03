import {ApiProperty} from '@nestjs/swagger';

export class UpdatePersonalInfluencerDto {
    @ApiProperty({required: true})
    id: string;

    @ApiProperty({required: true})
    firstName: string;

    @ApiProperty({required: true})
    influencerName: string;

    @ApiProperty({required: true})
    email: string

    @ApiProperty({required: true})
    phone: string
}
