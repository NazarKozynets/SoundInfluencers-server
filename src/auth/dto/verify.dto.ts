import { ApiProperty } from '@nestjs/swagger';

export class VerifyDto {
  @ApiProperty({ required: true })
  token: string;

  @ApiProperty({ required: true })
  role: string;
}
