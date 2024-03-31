import { ApiProperty } from '@nestjs/swagger';

export class LoginClientDto {
  @ApiProperty({ required: true })
  email: string;

  @ApiProperty({ required: true })
  password: string;
}
