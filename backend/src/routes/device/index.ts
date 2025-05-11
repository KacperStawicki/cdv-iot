import { PrismaClient } from '@prisma/client';
import { generateDeviceAuthKey } from '../../utils/deviceAuth';
import { DeviceClaimSchema } from '../../types/device';
import { deviceConnections } from '../websocket';
import { z } from 'zod';
import { TokenDecoded } from '../../utils/types';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

// Define schemas
const RegisterDeviceSchema = z.object({
  deviceId: z.string(),
});

const deviceRoutes: FastifyPluginAsyncZod = async (fastify): Promise<void> => {
  const prisma = new PrismaClient();

  // Register a new device
  fastify.post<{ Body: z.infer<typeof RegisterDeviceSchema> }>(
    '/register',
    {
      schema: {
        body: RegisterDeviceSchema,
        response: {
          200: z.object({
            deviceId: z.string(),
            authKey: z.string(),
          }),
        },
        tags: ['Device'],
        summary: 'Register a new device',
        description: 'Register a new device and generate an authentication key',
      },
    },
    async (request, reply) => {
      const { deviceId } = request.body;

      // Check if device already exists
      const existingDevice = await prisma.device.findUnique({
        where: { id: deviceId },
      });

      if (existingDevice) {
        return reply.status(400).send({
          error: 'Device already registered',
        });
      }

      // Generate a new authentication key
      const authKey = generateDeviceAuthKey();

      // Create the device
      const device = await prisma.device.create({
        data: {
          id: deviceId,
          name: `Device ${deviceId}`,
          authKey,
          claimed: false,
          thresholdRed: 10,
          thresholdYellow: 40,
          thresholdGreen: 60,
        },
      });

      return {
        deviceId: device.id,
        authKey: device.authKey,
      };
    }
  );

  // Claim a device
  fastify.post<{ Body: z.infer<typeof DeviceClaimSchema> }>(
    '/claim',
    {
      schema: {
        body: DeviceClaimSchema,
        response: {
          200: z.object({
            success: z.boolean(),
            device: z.object({
              id: z.string(),
              name: z.string(),
              claimed: z.boolean(),
            }),
          }),
        },
        tags: ['Device'],
        summary: 'Claim a device',
        description: 'Claim a device and assign it to the authenticated user',
      },
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { deviceId, authKey, name } = request.body;

      // Get authenticated user
      const userId = request.user as TokenDecoded;

      // Find the device
      const device = await prisma.device.findUnique({
        where: { id: deviceId },
      });

      if (!device) {
        return reply.status(404).send({
          error: 'Device not found',
        });
      }

      // Check if device is already claimed
      if (device.claimed) {
        return reply.status(400).send({
          error: 'Device already claimed',
        });
      }

      // Verify the authentication key
      if (device.authKey !== authKey) {
        return reply.status(401).send({
          error: 'Invalid authentication key',
        });
      }

      // Update the device
      const updatedDevice = await prisma.device.update({
        where: { id: deviceId },
        data: {
          userId: userId.id,
          name: name || device.name,
          claimed: true,
        },
      });

      // Notify the device if it's connected
      if (deviceConnections.has(deviceId)) {
        const connection = deviceConnections.get(deviceId);
        connection?.send(
          JSON.stringify({
            type: 'claimed',
            claimed: true,
            thresholdRed: updatedDevice.thresholdRed,
            thresholdYellow: updatedDevice.thresholdYellow,
            thresholdGreen: updatedDevice.thresholdGreen,
          })
        );

        // Log a message about the notification
        fastify.log.info(`Sent claimed notification to device ${deviceId}`);
      }

      return {
        success: true,
        device: {
          id: updatedDevice.id,
          name: updatedDevice.name,
          claimed: updatedDevice.claimed,
        },
      };
    }
  );

  // Get all devices for the authenticated user
  fastify.get(
    '/',
    {
      schema: {
        response: {
          200: z.array(
            z.object({
              id: z.string(),
              name: z.string().nullable(),
              claimed: z.boolean(),
              thresholdRed: z.number(),
              thresholdYellow: z.number(),
              thresholdGreen: z.number(),
            })
          ),
        },
        tags: ['Device'],
        summary: 'Get all devices',
        description: 'Get all devices for the authenticated user',
      },
      preHandler: [fastify.authenticate],
    },
    async (request) => {
      // Get authenticated user
      const userId = request.user as TokenDecoded;

      const devices = await prisma.device.findMany({
        where: { userId: userId.id },
        select: {
          id: true,
          name: true,
          claimed: true,
          thresholdRed: true,
          thresholdYellow: true,
          thresholdGreen: true,
        },
      });

      return devices;
    }
  );
};

export default deviceRoutes;
