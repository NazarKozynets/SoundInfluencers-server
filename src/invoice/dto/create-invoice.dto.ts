import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDtoDto {
  @ApiProperty({ required: true })
  influencerId: string;

  @ApiProperty({ required: true, default: 'pending' })
  status: string;

  @ApiProperty({ required: true })
  payee: string;

  @ApiProperty({ required: true })
  bankName: string;

  @ApiProperty({ required: true })
  bankBranchName: string;

  @ApiProperty({ required: true })
  bankCountry: string;

  @ApiProperty({ required: true })
  bankAccountCurrency: string;

  @ApiProperty({ required: true })
  sortCode: string;

  @ApiProperty({ required: true })
  accountNumber: string;

  @ApiProperty({ required: true })
  swiftOrBic: string;

  @ApiProperty({ required: true })
  contactName: string;

  @ApiProperty({ required: true })
  contactPhone: string;

  @ApiProperty({ required: true })
  contactEmail: string;

  @ApiProperty({ required: true })
  companyName: string;

  @ApiProperty({ required: true })
  companyId: string;

  @ApiProperty({ required: true })
  street: string;

  @ApiProperty({ required: true })
  city: string;

  @ApiProperty({ required: true })
  state: string;

  @ApiProperty({ required: true })
  postcode: string;

  @ApiProperty({ required: true })
  country: string;

  @ApiProperty({ required: true })
  notes: string;

  @ApiProperty({ required: true })
  amount: number;

  @ApiProperty({ required: false })
  vat: string;

  @ApiProperty({ required: true })
  description: string;
}
