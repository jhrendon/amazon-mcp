import axios from 'axios';
import { createGunzip } from 'zlib';
import { Readable } from 'stream';
import type { AmazonApiClient } from '../client/amazon-api-client.js';

export type ReportProcessingStatus =
  | 'IN_QUEUE'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'CANCELLED'
  | 'FATAL';

export interface ReportPollerConfig {
  client: AmazonApiClient;
  getStatusPath: (reportId: string) => string;
  getDownloadPath: (reportId: string) => string;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
  statusField?: string;
  terminalStatuses?: string[];
}

export interface ReportStatus {
  reportId: string;
  status: ReportProcessingStatus;
  downloadUrl?: string;
  failureReason?: string;
}

export interface PollOptions {
  maxWaitMs?: number;
  pollIntervalMs?: number;
  onStatusChange?: (status: ReportProcessingStatus) => void;
}

export class ReportPoller {
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;
  private readonly statusField: string;
  private readonly terminalStatuses: string[];

  constructor(private readonly config: ReportPollerConfig) {
    this.pollIntervalMs = config.pollIntervalMs ?? 5000;
    this.maxPollAttempts = config.maxPollAttempts ?? 120;
    this.statusField = config.statusField ?? 'processingStatus';
    this.terminalStatuses = config.terminalStatuses ?? ['DONE', 'CANCELLED', 'FATAL'];
  }

  async getReportStatus(reportId: string): Promise<ReportStatus> {
    const path = this.config.getStatusPath(reportId);
    const data = await this.config.client.get<Record<string, unknown>>(path);

    const status = (data[this.statusField] as string) ?? 'IN_PROGRESS';
    const downloadUrl = data['reportDocumentId'] as string | undefined;

    return {
      reportId,
      status: status as ReportProcessingStatus,
      downloadUrl,
    };
  }

  async waitForCompletion(
    reportId: string,
    options: PollOptions = {}
  ): Promise<ReportStatus> {
    const { maxWaitMs = 300000, pollIntervalMs = this.pollIntervalMs, onStatusChange } = options;

    const startTime = Date.now();
    let lastStatus: ReportProcessingStatus | null = null;
    let attempts = 0;

    while (Date.now() - startTime < maxWaitMs && attempts < this.maxPollAttempts) {
      const current = await this.getReportStatus(reportId);

      if (current.status !== lastStatus) {
        lastStatus = current.status;
        onStatusChange?.(current.status);
      }

      if (this.terminalStatuses.includes(current.status)) {
        return current;
      }

      await sleep(pollIntervalMs);
      attempts++;
    }

    return {
      reportId,
      status: lastStatus ?? 'IN_PROGRESS',
      failureReason: `Timeout waiting for report completion (waited ${maxWaitMs}ms)`,
    };
  }

  async downloadReport(reportId: string, destPath: string): Promise<void> {
    const path = this.config.getDownloadPath(reportId);
    const data = await this.config.client.get<Record<string, unknown>>(path);

    const url = data['url'] as string;
    const compressionAlgorithm = data['compressionAlgorithm'] as string | undefined;

    if (!url) {
      throw new Error(`No download URL found for report ${reportId}`);
    }

    const content = await downloadAndDecompress(url, compressionAlgorithm);

    const { writeFile } = await import('fs/promises');
    await writeFile(destPath, content, 'utf-8');
  }
}

async function downloadAndDecompress(
  url: string,
  compressionAlgorithm?: string
): Promise<string> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });

  const data = Buffer.from(response.data);
  const contentEncoding =
    response.headers['content-encoding']?.toString().toLowerCase() ?? '';

  if (
    compressionAlgorithm === 'GZIP' ||
    contentEncoding === 'gzip' ||
    isGzipBuffer(data)
  ) {
    return decompressGzip(data);
  }

  return data.toString('utf-8');
}

function isGzipBuffer(data: Buffer): boolean {
  return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
}

async function decompressGzip(data: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const gunzip = createGunzip();
    const chunks: Buffer[] = [];

    const stream = Readable.from(data);
    stream
      .pipe(gunzip)
      .on('data', (chunk: Buffer) => chunks.push(chunk))
      .on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')))
      .on('error', reject);
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
