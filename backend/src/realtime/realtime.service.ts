import { Injectable, Logger } from '@nestjs/common';
import { Response } from 'express';

export interface RealtimeEvent {
  type: 'notification' | 'post_update' | 'member_join' | 'invitation' | 'system';
  data: any;
  timestamp: string;
  id: string;
}

interface Connection {
  id: string;
  userId: string;
  response: Response;
}

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private connections: Map<string, Connection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();

  registerConnection(userId: string, response: Response): string {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const connection: Connection = {
      id: connectionId,
      userId,
      response,
    };

    this.connections.set(connectionId, connection);

    // Track user's connections
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(connectionId);

    this.logger.log(`User ${userId} connected with connection ${connectionId}`);
    return connectionId;
  }

  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove from user's connections
      const userConnections = this.userConnections.get(connection.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }

      this.connections.delete(connectionId);
      this.logger.log(`Connection ${connectionId} removed`);
    }
  }

  sendToUser(userId: string, event: RealtimeEvent): void {
    const userConnections = this.userConnections.get(userId);
    if (!userConnections) {
      return;
    }

    const eventData = `data: ${JSON.stringify(event)}\n\n`;
    
    userConnections.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection) {
        try {
          connection.response.write(eventData);
        } catch (error) {
          this.logger.error(`Failed to send event to connection ${connectionId}:`, error);
          this.removeConnection(connectionId);
        }
      }
    });
  }

  sendToAll(event: RealtimeEvent): void {
    const eventData = `data: ${JSON.stringify(event)}\n\n`;
    
    this.connections.forEach((connection, connectionId) => {
      try {
        connection.response.write(eventData);
      } catch (error) {
        this.logger.error(`Failed to send event to connection ${connectionId}:`, error);
        this.removeConnection(connectionId);
      }
    });
  }

  sendToOrganization(organizationId: string, event: RealtimeEvent): void {
    // This would need to be implemented based on your organization membership logic
    // For now, we'll send to all users (you can filter by organization membership)
    this.sendToAll(event);
  }

  // Convenience methods for common events
  sendNotification(userId: string, message: string, data?: any): void {
    this.sendToUser(userId, {
      type: 'notification',
      data: { message, ...data },
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    });
  }

  sendPostUpdate(userId: string, postTitle: string, data?: any): void {
    this.sendToUser(userId, {
      type: 'post_update',
      data: { title: postTitle, ...data },
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    });
  }

  sendMemberJoin(organizationId: string, memberName: string, data?: any): void {
    this.sendToOrganization(organizationId, {
      type: 'member_join',
      data: { memberName, ...data },
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    });
  }

  sendInvitation(userId: string, message: string, data?: any): void {
    this.sendToUser(userId, {
      type: 'invitation',
      data: { message, ...data },
      timestamp: new Date().toISOString(),
      id: Date.now().toString(),
    });
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getUserConnectionCount(userId: string): number {
    const userConnections = this.userConnections.get(userId);
    return userConnections ? userConnections.size : 0;
  }
} 