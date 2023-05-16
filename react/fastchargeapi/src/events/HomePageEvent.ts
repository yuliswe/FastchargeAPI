import { AppEvent, AppEventStream, mapState, to } from "react-appevent-redux";
import { RootAppState } from "../states/RootAppState";

class LoadCategories extends AppEvent<RootAppState> {
    constructor() {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        // todo
    }
    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            home: mapState({
                categories: to([
                    {
                        title: "Development",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                    },
                    {
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                    },
                ]),
            }),
        });
    }
}

class LoadFeaturedProducts extends AppEvent<RootAppState> {
    constructor() {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        // todo
    }
    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            home: mapState({
                featuredProducts: to([
                    {
                        pk: "1",
                        logo: "",
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                        tags: ["Business"],
                    },
                    {
                        pk: "2",
                        logo: "",
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                        tags: ["Business"],
                    },
                ]),
            }),
        });
    }
}

class LoadLatestProducts extends AppEvent<RootAppState> {
    constructor() {
        super();
    }
    reducer(state: RootAppState): RootAppState {
        return state;
    }
    async *run(state: RootAppState): AppEventStream<RootAppState> {
        // todo
    }
    reduceAfter(state: RootAppState): RootAppState {
        return state.mapState({
            home: mapState({
                latestProducts: to([
                    {
                        pk: "1",
                        logo: "",
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                        tags: ["Business"],
                    },
                    {
                        pk: "2",
                        logo: "",
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                        tags: ["Business"],
                    },
                    {
                        pk: "3",
                        logo: "",
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                        tags: ["Business"],
                    },
                    {
                        pk: "4",
                        logo: "",
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                        tags: ["Business"],
                    },
                    {
                        pk: "5",
                        logo: "",
                        title: "Techmesh",
                        description: "Facilisis in orci purus adipiscing dictumst ut cras.",
                        link: "test",
                        tags: ["Business"],
                    },
                ]),
            }),
        });
    }
}

export const HomePageEvent = {
    LoadFeaturedProducts,
    LoadLatestProducts,
    LoadCategories,
};
