import { AppEvent, AppEventStream } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";
import { AppContext } from "../AppContext";

class LoadTerms extends AppEvent<RootAppState> {
    constructor(public context: AppContext, public options: {}) {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        // TODO: Implement reducer
    }
    reducerAfter(state: RootAppState): RootAppState {
        return state;
    }
}

export const TermsEvent = {
    LoadTerms,
};
