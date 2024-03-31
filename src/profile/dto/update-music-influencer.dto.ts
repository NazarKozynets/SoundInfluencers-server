import { ApiProperty } from '@nestjs/swagger';

export class UpdateMusicStyleInfluencerDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  musicStyle: string;

  
}
