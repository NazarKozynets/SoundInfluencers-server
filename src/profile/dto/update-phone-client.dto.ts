import { ApiProperty } from '@nestjs/swagger';

export class UpdatePhoneClientDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  phone: string;
}
