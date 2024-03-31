import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanyClientDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  company: string;

  @ApiProperty({ required: true })
  companyType: string;
}
