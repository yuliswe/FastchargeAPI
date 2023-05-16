import { AppState, PartialProps } from "react-appevent-redux";
import { HomePageProductListProduct } from "../stateless-components/HomePageProductList";

export type HomePageCategoryListCategory = {
    title: string;
    link: string;
    description: string;
};

export class HomeAppState extends AppState {
    welcomeText = "Welcome!";
    featuredProducts = new Array<HomePageProductListProduct>();
    latestProducts = new Array<HomePageProductListProduct>();
    categories = new Array<HomePageCategoryListCategory>();
    constructor(props: PartialProps<HomeAppState>) {
        super();
        this.assignProps(props);
    }
}
