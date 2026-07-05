/** One live connection, as recorded by collector/rate-streamer in Redis. */
export interface ConnectionInfo {
    id: string;
    ip: string;
    /** Only ever set by the collector, once a connection authenticates as a broker. */
    broker: string | null;
    connected_at: number;
}

/** Connections currently held by one running instance of a component. */
export interface InstanceAnalytics {
    instance: string;
    connections: ConnectionInfo[];
}
