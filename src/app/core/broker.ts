/** Public view of a broker, as returned by `GET /api/brokers`. */
export interface Broker {
    id: string;
    name: string;
    has_key: boolean;
    allowed_ips: string[];
    open_account_url: string;
    /** Full data URL (`data:image/...;base64,...`) or null when no logo is set. */
    logo: string | null;
}

/**
 * Returned once when a key is issued (create or regenerate). `api_key` is the
 * plaintext key — it is never stored server-side and cannot be retrieved again.
 */
export interface IssuedKey {
    id: string;
    name: string;
    api_key: string;
}
