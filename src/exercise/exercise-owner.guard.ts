import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExerciseService } from './exercise.service';

@Injectable()
export class ExerciseOwnerGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly exerciseService: ExerciseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const exerciseId = request.params.id;

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ForbiddenException('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Decode token to get user info
      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // Fetch the exercise
      const exercise = await this.exerciseService.findOne(exerciseId);

      // Check if the user owns the exercise
      if (exercise.userId !== userId) {
        throw new ForbiddenException('You can only access your own exercises');
      }

      // Add user info to request for use in controller
      request.user = payload;
      return true;
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException('Invalid token or exercise not found');
    }
  }
}
