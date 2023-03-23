import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
    title: string;
    Svg?: React.ComponentType<React.ComponentProps<"svg">>;
    img?: string;
    description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
    {
        title: "Easy to Use",
        img: require("@site/static/img/easy-to-use.png").default,
        description: <>Selling your API only takes 3 commands.</>,
    },
    {
        title: "Focus on What Matters",
        img: require("@site/static/img/focus-on-what-matters.png").default,
        description: <>Do not worry about billing and payments. We handle that for you.</>,
    },
    {
        title: "Super Fast",
        img: require("@site/static/img/super-fast.png").default,
        // Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
        description: <>Achieve milli-second response time via the FastchargeAPI gateway.</>,
    },
];

function Feature({ title, Svg, description, img }: FeatureItem) {
    return (
        <div className={clsx("col col--4")}>
            <div className="text--center">
                {Svg && <Svg className={styles.featureSvg} role="img" />}
                {img && (
                    <img
                        src={img}
                        width={128}
                        height={128}
                        style={{
                            margin: "3rem",
                        }}
                        alt={title}
                    />
                )}
            </div>
            <div className="text--center padding-horiz--md">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
}

export default function HomepageFeatures(): JSX.Element {
    return (
        <section className={styles.features}>
            <div className="container">
                <div className="row">
                    {FeatureList.map((props, idx) => (
                        <Feature key={idx} {...props} />
                    ))}
                </div>
            </div>
        </section>
    );
}
