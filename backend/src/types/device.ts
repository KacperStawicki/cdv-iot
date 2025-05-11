import { z } from 'zod';

export const DeviceSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  userId: z.string().nullable(),
  authKey: z.string(),
  claimed: z.boolean(),
  thresholdRed: z.number().int().min(0).max(100),
  thresholdYellow: z.number().int().min(0).max(100),
  thresholdGreen: z.number().int().min(0).max(100),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const DeviceClaimSchema = z.object({
  deviceId: z.string(),
  authKey: z.string(),
  name: z.string().optional(),
});

export type DeviceClaim = z.infer<typeof DeviceClaimSchema>;
