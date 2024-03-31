import { ApiProperty } from '@nestjs/swagger';

export class UpdateInvoiceDetailsDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  firstName: string;

  @ApiProperty({ required: true })
  lastName: string;

  @ApiProperty({ required: true })
  address: string;

  @ApiProperty({ required: true })
  country: string;

  @ApiProperty({ required: true })
  vatNumber: string;
}
