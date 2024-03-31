import { ApiProperty } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ required: true })
  firstName: string;

  @ApiProperty({ required: true })
  company: string;

  @ApiProperty({ required: true })
  companyType: string;

  @ApiProperty({ required: true })
  instagramUsername: string;

  @ApiProperty({ required: true })
  email: string;

  @ApiProperty({ required: true })
  phone: string;

  @ApiProperty({ required: true })
  referalCode: string;

  @ApiProperty({ required: true })
  password: string;
}
