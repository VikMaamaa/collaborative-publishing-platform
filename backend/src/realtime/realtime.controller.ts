import { Controller, Get, Query, Res, UseGuards, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RealtimeService } from './realtime.service';

@Controller('realtime')
export class RealtimeController {
  constructor(private readonly realtimeService: RealtimeService) {}

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async getEvents(
    @Query('userId') userId: string,
    @Query('token') token: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    // Verify the user is requesting their own events
    if (req.user['id'] !== userId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Send initial connection message
    res.write(`data: ${JSON.stringify({
      type: 'connection',
      data: { message: 'Connected to real-time events' },
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    })}\n\n`);

    // Register this connection
    const connectionId = this.realtimeService.registerConnection(userId, res);

    // Handle client disconnect
    req.on('close', () => {
      this.realtimeService.removeConnection(connectionId);
    });

    req.on('error', () => {
      this.realtimeService.removeConnection(connectionId);
    });
  }
} 