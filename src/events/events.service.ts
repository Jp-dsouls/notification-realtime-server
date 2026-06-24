import { Injectable } from '@nestjs/common';

@Injectable()
export class EventsService {
  private connectedClients: Set<string> = new Set();

  addClient(clientId: string): void {
    this.connectedClients.add(clientId);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsService.addClient',
        clientId,
        totalClients: this.connectedClients.size,
        message: 'Client added',
      }),
    );
  }

  removeClient(clientId: string): void {
    this.connectedClients.delete(clientId);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'realtime-server',
        context: 'EventsService.removeClient',
        clientId,
        totalClients: this.connectedClients.size,
        message: 'Client removed',
      }),
    );
  }

  getClientCount(): number {
    return this.connectedClients.size;
  }

  getConnectedClients(): string[] {
    return Array.from(this.connectedClients);
  }
}
