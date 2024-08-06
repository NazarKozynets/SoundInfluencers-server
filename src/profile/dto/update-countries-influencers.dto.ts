import { ApiProperty } from '@nestjs/swagger';

export class UpdateCountriesInfluencersDto {
  @ApiProperty({ required: true })
  id: string;

  @ApiProperty({ required: true })
  countries: { country: string; percentage: number }[];
}