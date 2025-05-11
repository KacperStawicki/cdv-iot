import { generateDeviceAuthKey } from '../../../utils/deviceAuth';
import { z } from 'zod';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

// Define schema
const RegisterDeviceSchema = z.object({
  deviceId: z.string(),
});

const registerDevice: FastifyPluginAsyncZod = async (
  fastify
): Promise<void> => {
  fastify.post<{ Body: z.infer<typeof RegisterDeviceSchema> }>(
    '',
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
      const existingDevice = await fastify.prismaClient.device.findUnique({
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
      const device = await fastify.prismaClient.device.create({
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
};

export default registerDevice;
