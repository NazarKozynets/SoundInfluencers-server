import { ApiProperty } from '@nestjs/swagger';

interface ISocial {
  musicStyle: string;
  musicStyleOther: string;
  instagramUsername: string;
  instagramLink: string;
  followersNumber: string;
  logo: string;
  price: string;
}

const typesSocialMedia = {
  musicStyle: { type: 'string' },
  musicStyleOther: { type: 'string' },
  instagramUsername: { type: 'string' },
  instagramLink: { type: 'string' },
  followersNumber: { type: 'string' },
  logo: { type: 'string' },
  price: { type: 'string' },
};

export class CreateInfluencerDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty({
    type: 'array',
    items: { type: 'object', properties: typesSocialMedia },
  })
  tiktok: ISocial[];
  soundcloud: ISocial[];
  facebook: ISocial[];
  instagram: ISocial[];
  spotify: ISocial[];
  press: ISocial[];

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  password: string;
}
