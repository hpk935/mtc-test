import { z } from 'zod/v4';
import { REFERENCE_CODE_KIND } from './constants';
import type { ReferenceCodeKind } from './constants';

const netDaysSchema = z
    .string()
    .trim()
    .optional()
    .transform((value, ctx) => {
        if (!value) return null;
        const days = Number(value);
        if (!Number.isInteger(days) || days < 0 || days > 9999) {
            ctx.addIssue({
                code: 'custom',
                message: 'Net days must be a whole number from 0 to 9999',
            });
            return z.NEVER;
        }
        return days;
    });

export function referenceCodeSchema(kind: ReferenceCodeKind) {
    const config = REFERENCE_CODE_KIND[kind];
    return z.object({
        code: z
            .string()
            .trim()
            .min(1, 'Code is required')
            .max(
                config.codeMaxLength,
                `Code must be ${config.codeMaxLength} characters or fewer`,
            ),
        description: z
            .string()
            .trim()
            .max(255, 'Description must be 255 characters or fewer')
            .default(''),
        netDays: netDaysSchema,
        // Only the edit form sends a status; new codes start active.
        isActive: z
            .enum(['true', 'false'])
            .default('true')
            .transform((value) => value === 'true'),
    });
}

export type ReferenceCodeInput = z.infer<
    ReturnType<typeof referenceCodeSchema>
>;
