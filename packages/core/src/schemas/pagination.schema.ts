import { z } from 'zod';

/**
 * Query parameters for paginated list endpoints.
 * Parsed from URL query string (all values arrive as strings).
 */
export const paginationInputSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).default('asc'),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

/**
 * Factory: creates a paginated response schema wrapping any data schema.
 */
export const createPaginatedResponseSchema = <T extends z.ZodTypeAny>(
  dataSchema: T
): z.ZodObject<{ data: z.ZodArray<T>; pagination: typeof paginationMetaSchema }> =>
  z.object({
    data: z.array(dataSchema),
    pagination: paginationMetaSchema,
  });

/**
 * Builds pagination metadata from query results.
 */
export const buildPaginationMeta = (input: PaginationInput, total: number): PaginationMeta => ({
  page: input.page,
  pageSize: input.pageSize,
  total,
  totalPages: Math.ceil(total / input.pageSize),
});

export type PaginationInput = z.infer<typeof paginationInputSchema>;
export type PaginationMeta = z.infer<typeof paginationMetaSchema>;
