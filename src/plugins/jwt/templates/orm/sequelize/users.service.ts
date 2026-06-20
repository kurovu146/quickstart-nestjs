import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './models/user.model';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async create(data: { email: string; password: string; name?: string }) {
    return this.userModel.create(data as any);
  }

  async findByEmail(email: string) {
    return this.userModel.findOne({ where: { email } });
  }

  async findAll() {
    return this.userModel.findAll({ attributes: { exclude: ['password'] } });
  }
}
