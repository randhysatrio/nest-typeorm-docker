import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEmail } from 'class-validator';
import * as bcrypt from 'bcryptjs';

import { BCRYPT_REGEX } from 'src/utils/regex';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 255, unique: true })
  @IsEmail()
  email: string;

  @Column({ nullable: true, default: null })
  password?: string;

  @Column({ length: 20, unique: true, nullable: true, default: null })
  phone?: string;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'google_id', unique: true, nullable: true, default: null })
  googleId?: string;

  @Column({ name: 'apple_id', unique: true, nullable: true, default: null })
  appleId?: string;

  @Column({ nullable: true, default: null })
  picture?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date;

  @BeforeInsert()
  @BeforeUpdate()
  hashPassword() {
    if (this.password && !BCRYPT_REGEX.test(this.password)) {
      const salt = bcrypt.genSaltSync(10);
      this.password = bcrypt.hashSync(this.password, salt);
    }
  }
}
