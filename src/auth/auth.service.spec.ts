// import { Test, TestingModule } from '@nestjs/testing';
// import { AuthService } from './auth.service';
// import { getModelToken } from '@nestjs/mongoose';
// import { Influencer } from './schemas/influencer.schema'; // Импортируйте свою схему
// import * as bcrypt from 'bcrypt';
// import { generateRandomString } from './auth.service';
// import { sendMail } from '../utils/mail';
//
// jest.mock('bcrypt');
// jest.mock('../utils/random');
// jest.mock('../utils/mail');
//
// describe('AuthService', () => {
//   let service: AuthService;
//   let influencerModel: any;
//   let clientModel: any;
//   let verifyInfluencerModel: any;
//
//   beforeEach(async () => {
//     const module: TestingModule = await Test.createTestingModule({
//       providers: [
//         AuthService,
//         {
//           provide: getModelToken('Influencer'),
//           useValue: {
//             findOne: jest.fn(),
//             find: jest.fn(),
//             create: jest.fn(),
//           },
//         },
//         {
//           provide: getModelToken('Client'),
//           useValue: {
//             findOne: jest.fn(),
//           },
//         },
//         {
//           provide: getModelToken('VerifyInfluencer'),
//           useValue: {
//             create: jest.fn(),
//           },
//         },
//       ],
//     }).compile();
//
//     service = module.get<AuthService>(AuthService);
//     influencerModel = module.get(getModelToken('Influencer'));
//     clientModel = module.get(getModelToken('Client'));
//     verifyInfluencerModel = module.get(getModelToken('VerifyInfluencer'));
//   });
//
//   it('should be defined', () => {
//     expect(service).toBeDefined();
//   });
//
//   it('should create an influencer with countries field', async () => {
//     const createInfluencerDto = {
//       firstName: 'John',
//       email: 'john@example.com',
//       phone: '1234567890',
//       password: 'password123',
//       instagram: [
//         {
//           musicStyle: 'Pop',
//           musicStyleOther: '',
//           instagramUsername: 'john_doe',
//           instagramLink: 'http://instagram.com/john_doe',
//           followersNumber: '10000',
//           logo: 'http://logo.url',
//           price: '200',
//           countries: [
//             { country: 'USA', percentage: 40 },
//             { country: 'Canada', percentage: 20 },
//           ],
//         },
//       ],
//       tiktok: [],
//       soundcloud: [],
//       facebook: [],
//       spotify: [],
//       press: [],
//     };
//
//     influencerModel.findOne.mockResolvedValue(null); // No user found
//     clientModel.findOne.mockResolvedValue(null); // No client found
//     influencerModel.find.mockResolvedValue([]); // No existing influencers
//     clientModel.findOne.mockResolvedValue(null); // No Instagram client found
//     influencerModel.create.mockResolvedValue({
//       ...createInfluencerDto,
//       password: 'hashedpassword123',
//     });
//     verifyInfluencerModel.create.mockResolvedValue({});
//     (bcrypt.hashSync as jest.Mock).mockReturnValue('hashedpassword123');
//     (generateRandomString as jest.Mock).mockReturnValue('randomstring');
//     (sendMail as jest.Mock).mockResolvedValue({});
//
//     const result = await service.createInfluencer(createInfluencerDto);
//
//     expect(result).toEqual({
//       code: 201,
//       newUser: {
//         ...createInfluencerDto,
//         password: 'hashedpassword123',
//       },
//     });
//
//     expect(influencerModel.create).toHaveBeenCalledWith({
//       ...createInfluencerDto,
//       instagram: createInfluencerDto.instagram.map((item) => ({
//         ...item,
//         musicStyle: item.musicStyle === 'Other' ? item.musicStyleOther : item.musicStyle,
//       })),
//       password: 'hashedpassword123',
//     });
//   });
// });
