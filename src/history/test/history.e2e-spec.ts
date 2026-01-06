import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from '../../../app.module';
import { History } from '../history.entity';
import { Exercise } from '../../exercise/exercise.entity';
import { User } from '../../user/user.entity';

describe('History (e2e)', () => {
  let app: INestApplication<App>;
  let historyRepository: Repository<History>;
  let exerciseRepository: Repository<Exercise>;
  let userRepository: Repository<User>;
  let testUser: User;
  let testExercise: Exercise;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    historyRepository = moduleFixture.get<Repository<History>>(
      getRepositoryToken(History),
    );
    exerciseRepository = moduleFixture.get<Repository<Exercise>>(
      getRepositoryToken(Exercise),
    );
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    // Create test data
    testUser = await userRepository.save({
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
    });

    testExercise = await exerciseRepository.save({
      name: 'Test Exercise',
      userId: testUser.id,
    });
  });

  afterEach(async () => {
    await historyRepository.clear();
    await exerciseRepository.clear();
    await userRepository.clear();
    await app.close();
  });

  describe('/history (POST)', () => {
    it('should create a history record', () => {
      return request(app.getHttpServer())
        .post('/history')
        .send({
          bpm: 140,
          exerciseId: testExercise.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.bpm).toBe(140);
          expect(res.body.exerciseId).toBe(testExercise.id);
          expect(res.body).toHaveProperty('date');
        });
    });
  });

  describe('/history (GET)', () => {
    it('should return all history records', async () => {
      // Create test history records
      await historyRepository.save([
        { bpm: 120, exerciseId: testExercise.id },
        { bpm: 140, exerciseId: testExercise.id },
      ]);

      return request(app.getHttpServer())
        .get('/history')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('bpm');
          expect(res.body[0]).toHaveProperty('exerciseId');
          expect(res.body[0]).toHaveProperty('date');
        });
    });

    it('should return history records for a specific exercise', async () => {
      // Create another exercise
      const anotherExercise = await exerciseRepository.save({
        name: 'Another Exercise',
        userId: testUser.id,
      });

      // Create history records for both exercises
      await historyRepository.save([
        { bpm: 120, exerciseId: testExercise.id },
        { bpm: 130, exerciseId: testExercise.id },
        { bpm: 150, exerciseId: anotherExercise.id },
      ]);

      return request(app.getHttpServer())
        .get(`/history?exerciseId=${testExercise.id}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(
            res.body.every((record) => record.exerciseId === testExercise.id),
          ).toBe(true);
        });
    });
  });

  describe('/history/:id (GET)', () => {
    it('should return a history record by id', async () => {
      const historyRecord = await historyRepository.save({
        bpm: 135,
        exerciseId: testExercise.id,
      });

      return request(app.getHttpServer())
        .get(`/history/${historyRecord.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(historyRecord.id);
          expect(res.body.bpm).toBe(135);
          expect(res.body.exerciseId).toBe(testExercise.id);
          expect(res.body).toHaveProperty('date');
        });
    });

    it('should return 404 for non-existent history record', () => {
      return request(app.getHttpServer())
        .get('/history/non-existent-id')
        .expect(404);
    });
  });

  describe('/history/:id (DELETE)', () => {
    it('should delete a history record', async () => {
      const historyRecord = await historyRepository.save({
        bpm: 125,
        exerciseId: testExercise.id,
      });

      await request(app.getHttpServer())
        .delete(`/history/${historyRecord.id}`)
        .expect(200);

      // Verify history record was deleted
      const deletedRecord = await historyRepository.findOne({
        where: { id: historyRecord.id },
      });
      expect(deletedRecord).toBeNull();
    });
  });
});
