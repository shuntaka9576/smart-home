import * as z from 'zod';

const configSchema = z.object({
  NATURE_API_TOKEN: z.string(),
  REMO_DEVICE_ID: z.string(),
  AC_APPLIANCE_ID: z.string(),
  SMART_METER_APPLIANCE_ID: z.string(),
});

type Config = z.infer<typeof configSchema>;

const getConfig = (): Config => {
  const parseResult = configSchema.safeParse({
    NATURE_API_TOKEN: process.env.NATURE_API_TOKEN,
    REMO_DEVICE_ID: process.env.REMO_DEVICE_ID,
    AC_APPLIANCE_ID: process.env.AC_APPLIANCE_ID,
    SMART_METER_APPLIANCE_ID: process.env.SMART_METER_APPLIANCE_ID,
  });

  if (!parseResult.success) {
    throw new Error(
      `validatedConfigError: ${JSON.stringify(parseResult.error)}`
    );
  }

  return parseResult.data;
};

export const config = getConfig();
