export const parseEnum =
  <T extends string>(enumObject: Record<string, T>) =>
  (value: string): T => {
    if (!Object.values(enumObject).includes(value as T)) {
      throw new Error(`Invalid value. Must be one of ${Object.values(enumObject).join(", ")}`);
    }
    return value as T;
  };
