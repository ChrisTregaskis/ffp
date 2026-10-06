/**
 * Variables for a resource whose read resolves a publicId and whose write
 * resolves a UUID. See `.claude/rules/identifiers.md`.
 */
export interface SplitIdentifierVariables<TData> {
  /** The UUID the endpoint resolves, not the publicId the route carries */
  id: string;
  /** Required, not optional — both are strings, so a forgotten one fails silently */
  publicId: string;
  data: TData;
}
