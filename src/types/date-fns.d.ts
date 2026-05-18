declare module "date-fns" {
  export function format(
    date: Date | number | string,
    formatStr: string,
    options?: unknown
  ): string;
}
