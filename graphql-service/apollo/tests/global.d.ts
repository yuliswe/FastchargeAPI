declare namespace jest {
  interface Matchers<R> {
    toMatchSnapshotExceptForProps(props: unknown): R;
    toEqualStringArrayIgnoringOrder(props: unknown): R;
  }
}
