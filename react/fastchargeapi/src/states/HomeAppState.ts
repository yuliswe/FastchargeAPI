import { AppState, PartialProps } from "react-appevent-redux";
import { HomePageProductListProduct } from "../stateless-components/HomePageProductList";

export type HomePageCategoryListCategory = {
    title: string;
    tag: string;
    description: string;
};

export class HomeAppState extends AppState {
    featuredProducts = new Array<HomePageProductListProduct>();
    loadingFeaturedProducts = true;
    latestProducts = new Array<HomePageProductListProduct>();
    loadingLatestProducts = true;
    categories = new Array<HomePageCategoryListCategory>();
    constructor(props: PartialProps<HomeAppState>) {
        super();
        this.assignProps(props);
    }
}
