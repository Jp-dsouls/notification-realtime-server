export declare class EventsService {
    private connectedClients;
    addClient(clientId: string): void;
    removeClient(clientId: string): void;
    getClientCount(): number;
    getConnectedClients(): string[];
}
