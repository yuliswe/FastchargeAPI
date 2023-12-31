export function getTestStripeClient() {
  return {
    transfers: {
      create: jest.fn(),
    },
  };
}
