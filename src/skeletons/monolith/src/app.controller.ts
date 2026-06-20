import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Public so the root endpoint stays reachable even when an auth plugin
  // registers a global guard.
  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
