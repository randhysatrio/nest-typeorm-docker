import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { UserService } from './user.service';

import { User } from 'src/users/entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let repo: jest.Mocked<Repository<User>>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepo(),
        },
      ],
    }).compile();

    service = module.get(UserService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const id = 'abcd-1234';
  const name = 'Test User';
  const phone = '0812111222333';
  const email = 'test@mail.com';
  const pass = 'supeRSecr3t!';
  const hashedPass = 'hashedPass';

  it('should throw if email already registered', async () => {
    repo.findOne.mockResolvedValue({ id, email } as User);

    await expect(service.assertEmailExist(email)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email },
      select: ['id', 'email'],
    });
  });

  it('should pass if email is available', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.assertEmailExist(email)).resolves.toBeUndefined();

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { email },
      select: ['id', 'email'],
    });
  });

  it('should throw if phone already registered', async () => {
    repo.findOne.mockResolvedValue({ id, phone } as User);

    await expect(service.assertPhoneExist(phone)).rejects.toBeInstanceOf(
      ConflictException,
    );

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { phone },
      select: ['id', 'phone'],
    });
  });

  it('should pass if phone is available', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.assertPhoneExist(phone)).resolves.toBeUndefined();

    expect(repo.findOne).toHaveBeenCalledWith({
      where: { phone },
      select: ['id', 'phone'],
    });
  });

  it('should create a User', async () => {
    const payload = {
      name,
      email,
      phone,
      password: pass,
    };
    const createdUser = { ...payload, isVerified: true };

    repo.create.mockReturnValue(createdUser as User);
    repo.save.mockResolvedValue(createdUser as User);

    const user = await service.create(payload);

    expect(repo.create).toHaveBeenCalledWith(createdUser);

    expect(repo.save).toHaveBeenLastCalledWith(createdUser);

    expect(user).toEqual(createdUser);
  });

  it('should failed to validate if User not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(service.validatePassword(email, pass)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should failed to validate if User dont have password', async () => {
    repo.findOne.mockResolvedValue({ id, email } as User);

    const compareSpy = jest.spyOn(bcrypt, 'compare');

    await expect(service.validatePassword(email, pass)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );

    expect(compareSpy).not.toHaveBeenCalled();
  });

  it('should failed to validate if password mismatch', async () => {
    repo.findOne.mockResolvedValue({
      id,
      email,
      password: hashedPass,
    } as User);

    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

    await expect(service.validatePassword(email, pass)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should pass if password is correct and returns User without password', async () => {
    repo.findOne.mockResolvedValue({
      id,
      email,
      password: hashedPass,
    } as User);

    jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

    const user = await service.validatePassword(email, pass);

    expect(bcrypt.compare).toHaveBeenCalledWith(pass, hashedPass);

    expect(user).toEqual({ id, email });

    expect(user).not.toHaveProperty('password');
  });
});

const mockUserRepo = () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});
