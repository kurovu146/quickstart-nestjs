import { Controller, Get } from '@nestjs/common';
import { Public } from '@app/common';
import { AppService } from './app.service';

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
