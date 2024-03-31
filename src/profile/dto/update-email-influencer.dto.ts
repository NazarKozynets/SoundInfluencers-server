import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailInfluencerDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  email: string;
}
