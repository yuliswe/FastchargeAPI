import "jest-extended";

declare module "jest-snapshot" {
  interface SnapshotMatchers<R extends void | Promise<void>> {
    toMatchSnapshotExceptForProps(props: unknown): R;
  }
}
