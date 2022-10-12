import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BcryptHelper } from 'src/helper/bcrypt.helper';
import { MongoRepository } from 'typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { ListUsersInput } from './dto/listUsers.input';
@Injectable()
export class UserService {
  bcryptHelper = new BcryptHelper();

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: MongoRepository<UserEntity>,
  ) {}

  async create(userRequestData: any): Promise<any> {
    const findUser = await this.findOneByEmail(userRequestData.email);

    if (findUser) throw new BadRequestException('User already exists!');

    const data = {
      ...userRequestData,
      password: await this.bcryptHelper.hashString(userRequestData.password),
    };
    return this.userRepo.save(data);
  }

  findAll(paginationQuery: ListUsersInput): Promise<any> {
    const { limit, offset } = paginationQuery;
    return this.userRepo.findAndCount({
      skip: offset,
      take: limit,
    });
  }

  async findOneByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: email },
      select: ['_id', 'email'],
    });

    return user;
  }
}
