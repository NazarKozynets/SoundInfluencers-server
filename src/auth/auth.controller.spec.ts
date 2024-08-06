import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateInfluencerDto } from './dto/create-influencer.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            createInfluencer: jest.fn().mockResolvedValue({
              code: 201,
              newUser: {
                firstName: 'John',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'hashedpassword123',
                instagram: [],
                tiktok: [],
                soundcloud: [],
                facebook: [],
                spotify: [],
                press: [],
              },
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an influencer', async () => {
    const createInfluencerDto: CreateInfluencerDto = {
      firstName: 'John',
      email: 'john@example.com',
      phone: '1234567890',
      password: 'password123',
      instagram: [
        {
          musicStyle: 'Pop',
          musicStyleOther: '',
          instagramUsername: 'john_doe',
          instagramLink: 'http://instagram.com/john_doe',
          followersNumber: '10000',
          logo: 'http://logo.url',
          price: '200',
          countries: [
            { country: 'USA', percentage: 40 },
            { country: 'Canada', percentage: 20 },
          ],
        },
      ],
      tiktok: [],
      soundcloud: [],
      facebook: [],
      spotify: [],
      press: [],
    };

    await expect(controller.createInfluencer(createInfluencerDto)).resolves.toEqual({
      code: 201,
      newUser: {
        firstName: 'John',
        email: 'john@example.com',
        phone: '1234567890',
        password: 'hashedpassword123',
        instagram: [],
        tiktok: [],
        soundcloud: [],
        facebook: [],
        spotify: [],
        press: [],
      },
    });

    expect(service.createInfluencer).toHaveBeenCalledWith(createInfluencerDto);
  });
});
