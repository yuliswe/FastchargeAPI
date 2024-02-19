import { AppEvent, type AppEventStream } from "react-appevent-redux";
import type { AppContext } from "src/AppContext";
import type { RootAppState } from "src/states/RootAppState";

class ExampleError404Event extends AppEvent<RootAppState> {
  constructor(public context: AppContext, public options: {}) {
    super();
  }
  reducer(state: RootAppState): RootAppState {
    throw new Error("Method not implemented.");
  }
  async *run(state: RootAppState): AppEventStream<RootAppState> {
    // TODO: Implement reducer
  }
  reducerAfter(state: RootAppState): RootAppState {
    return state;
  }
}

export const Error404Event = {
  ExampleError404Event,
};
