import { ApiProperty } from '@nestjs/swagger';

export class UpdatePersonalClientDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  firstName: string;

  @ApiProperty({ required: true })
  instagramUsername: string;

  @ApiProperty({ required: true })
  referalCode: string;

  @ApiProperty({ required: true })
  logo: string;
}
