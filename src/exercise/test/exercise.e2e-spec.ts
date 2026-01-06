import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../../app.module';
import { Exercise } from '../exercise.entity';
import { User } from '../../user/user.entity';

describe('Exercise (e2e)', () => {
  let app: INestApplication<App>;
  let exerciseRepository: Repository<Exercise>;
  let userRepository: Repository<User>;
  let testUser: User;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    exerciseRepository = moduleFixture.get<Repository<Exercise>>(
      getRepositoryToken(Exercise),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Create a test user with hashed password
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser = await userRepository.save({
      username: 'testuser',
      email: 'test@example.com',
      password: hashedPassword,
    });

    // Login to get access token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    accessToken = loginResponse.body.access_token;
  });

  afterEach(async () => {
    await exerciseRepository.clear();
    await userRepository.clear();
    await app.close();
  });

  describe('/exercises (POST)', () => {
    it('should create an exercise', () => {
      return request(app.getHttpServer())
        .post('/exercises')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Exercise',
          durationMinutes: 15,
          currentBpmRecord: 120,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Test Exercise');
          expect(res.body.userId).toBe(testUser.id);
          expect(res.body.durationMinutes).toBe(15);
          expect(res.body.currentBpmRecord).toBe(120);
        });
    });

    it('should return 400 for invalid data', () => {
      return request(app.getHttpServer())
        .post('/exercises')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: '',
        })
        .expect(400);
    });
  });

  describe('/exercises (GET)', () => {
    it('should return all exercises', async () => {
      // Create test exercises
      await exerciseRepository.save([
        { name: 'Exercise 1', userId: testUser.id },
        { name: 'Exercise 2', userId: testUser.id },
      ]);

      return request(app.getHttpServer())
        .get('/exercises')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('userId');
        });
    });

    it('should return exercises for a specific user', async () => {
      // Create another user
      const anotherUser = await userRepository.save({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'hashedpassword',
      });

      // Create exercises for both users
      await exerciseRepository.save([
        { name: 'User Exercise 1', userId: testUser.id },
        { name: 'User Exercise 2', userId: testUser.id },
        { name: 'Another User Exercise', userId: anotherUser.id },
      ]);

      return request(app.getHttpServer())
        .get(`/exercises?userId=${testUser.id}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(
            res.body.every((exercise) => exercise.userId === testUser.id),
          ).toBe(true);
        });
    });
  });

  describe('/exercises/:id (GET)', () => {
    it('should return an exercise by id', async () => {
      const exercise = await exerciseRepository.save({
        name: 'Test Exercise',
        userId: testUser.id,
        durationMinutes: 20,
      });

      return request(app.getHttpServer())
        .get(`/exercises/${exercise.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(exercise.id);
          expect(res.body.name).toBe('Test Exercise');
          expect(res.body.userId).toBe(testUser.id);
          expect(res.body.durationMinutes).toBe(20);
        });
    });

    it('should return 404 for non-existent exercise', () => {
      return request(app.getHttpServer())
        .get('/exercises/non-existent-id')
        .expect(404);
    });
  });

  describe('/exercises/:id (PATCH)', () => {
    it('should update an exercise', async () => {
      const exercise = await exerciseRepository.save({
        name: 'Original Exercise',
        userId: testUser.id,
        durationMinutes: 10,
      });

      return request(app.getHttpServer())
        .patch(`/exercises/${exercise.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Updated Exercise',
          durationMinutes: 25,
          currentBpmRecord: 150,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Exercise');
          expect(res.body.durationMinutes).toBe(25);
          expect(res.body.currentBpmRecord).toBe(150);
        });
    });
  });

  describe('/exercises/:id (DELETE)', () => {
    it('should delete an exercise', async () => {
      const exercise = await exerciseRepository.save({
        name: 'Test Exercise',
        userId: testUser.id,
      });

      await request(app.getHttpServer())
        .delete(`/exercises/${exercise.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify exercise was deleted
      const deletedExercise = await exerciseRepository.findOne({
        where: { id: exercise.id },
      });
      expect(deletedExercise).toBeNull();
    });
  });
});
