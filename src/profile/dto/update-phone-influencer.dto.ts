import { ApiProperty } from '@nestjs/swagger';

export class UpdatePhoneInfluencerDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  phone: string;
}
