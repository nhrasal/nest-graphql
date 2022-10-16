import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseService } from 'src/base/base.service';
import { BcryptHelper } from 'src/helper/bcrypt.helper';
import { UserJob } from 'src/modules/queues/jobs/user.job';
import { MongoRepository } from 'typeorm';
import { ListUsersInput } from '../dto/user/listUsers.input';
import { UserEntity } from '../entities/user.entity';
@Injectable()
export class UserService extends BaseService<UserEntity> {
  bcryptHelper = new BcryptHelper();

  constructor(
    @InjectRepository(UserEntity)
    private userRepo: MongoRepository<UserEntity>,
    private userJob: UserJob,
  ) {
    super(userRepo, UserEntity);
  }

  async store(userRequestData: any): Promise<any> {
    const findUser = await this.findOneByEmail(userRequestData.email);

    if (findUser) throw new BadRequestException('User already exists!');

    const data = {
      ...userRequestData,
      password: await this.bcryptHelper.hashString(userRequestData.password),
      deletedAt: null,
      token: null,
      emailVerified: false,
      userType: 'user',
      image: null,
    };
    const store = this.userRepo.save(data);
    if (store) {
      const token = await this.bcryptHelper.hashString(
        `${userRequestData.email}${Date.now()}`,
      );
      await this.userJob.add('accountVerification', {
        ...findUser,
        token: token,
      });
      return store;
    }
    throw new BadRequestException('Something went wrong.');
  }

  // findAll(paginationQuery: ListUsersInput): Promise<any> {
  //   const { limit, offset } = paginationQuery;
  //   return this.userRepo.findAndCount({
  //     skip: offset,
  //     take: limit,
  //   });
  // }

  async findOneByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: email },
      select: [
        '_id',
        'firstName',
        'lastName',
        'gender',
        'interests',
        'bio',
        'email',
        'password',
        'isActive',
      ],
    });

    return user;
  }
}
