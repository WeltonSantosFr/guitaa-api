import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../../app.module';
import { User } from '../user.entity';

describe('User (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );
  });

  afterEach(async () => {
    await userRepository.clear();
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should create a user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.username).toBe('testuser');
          expect(res.body.email).toBe('test@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send({
          username: '',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return all users', async () => {
      // Create a test user
      await userRepository.save({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      return request(app.getHttpServer())
        .get('/users')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('username');
          expect(res.body[0]).toHaveProperty('email');
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by id', async () => {
      const user = await userRepository.save({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      return request(app.getHttpServer())
        .get(`/users/${user.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(user.id);
          expect(res.body.username).toBe('testuser');
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/users/non-existent-id')
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user', async () => {
      const user = await userRepository.save({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      return request(app.getHttpServer())
        .patch(`/users/${user.id}`)
        .send({
          username: 'updateduser',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe('updateduser');
          expect(res.body.email).toBe('test@example.com');
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user', async () => {
      const user = await userRepository.save({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
      });

      await request(app.getHttpServer())
        .delete(`/users/${user.id}`)
        .expect(200);

      // Verify user was deleted
      const deletedUser = await userRepository.findOne({
        where: { id: user.id },
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login a user', async () => {
      // Create a test user
      await userRepository.save({
        username: 'testuser',
        email: 'test@example.com',
        password: '$2b$10$hashedpassword', // Pre-hashed password
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });
});
