import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailClientDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  email: string;
}
