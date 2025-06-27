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
  authKey: z.string(),
  name: z.string(),
});

export type DeviceClaim = z.infer<typeof DeviceClaimSchema>;

export const DeviceRenameSchema = z.object({
  deviceId: z.string(),
  name: z.string(),
});

export type DeviceRename = z.infer<typeof DeviceRenameSchema>;
