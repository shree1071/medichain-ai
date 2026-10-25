// Pinata IPFS Integration for MediChain AI
// Enables patient-owned, decentralized storage of encrypted health reports,
// calculating SHA-256 integrity hash & IPFS Content ID (CID) for Polygon smart contracts.

export interface PinataPinResult {
  success: boolean;
  cid: string;
  sha256: string;
  pinSize: number;
  timestamp: string;
  gatewayUrl: string;
}

/**
 * Upload a JSON record (clinical summary, intake notes, or prescription metadata)
 * to decentralized IPFS via Pinata.
 */
export async function pinRecordToIPFS(
  content: Record<string, any> | string,
  recordName = 'patient-clinical-record.json'
): Promise<PinataPinResult> {
  const response = await fetch('/api/pinata/pin-json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      name: recordName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `IPFS Pinning failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Resolve an IPFS Content ID (CID) to a public or dedicated gateway URL.
 */
export function getIPFSGatewayUrl(cid: string): string {
  const customGateway = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs';
  return `${customGateway.replace(/\/$/, '')}/${cid}`;
}
