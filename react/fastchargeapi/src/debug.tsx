import { useEffect, useRef } from "react";

/**
 * Helps tracking the props changes made in a react functional component.
 *
 * Prints the name of the properties/states variables causing a render (or re-render).
 * For debugging purposes only.
 *
 * @usage You can simply track the props of the components like this:
 *  useRenderingTrace('MyComponent', props);
 *
 * @usage You can also track additional state like this:
 *  const [someState] = useState(null);
 *  useRenderingTrace('MyComponent', { ...props, someState });
 *
 * @param componentName Name of the component to display
 * @param propsAndStates
 * @param level
 *
 * @see https://stackoverflow.com/a/51082563/2391795
 */
export const useRenderingTrace = (componentName: string, propsAndStates: Record<string, unknown>) => {
  const prev = useRef(propsAndStates);

  useEffect(() => {
    const changedProps = Object.entries(propsAndStates).reduce(
      (property: Record<string, unknown>, [key, value]: [string, unknown]) => {
        if (prev.current[key] !== value) {
          property[key] = {
            old: prev.current[key],
            new: value,
          };
        }
        return property;
      },
      {}
    );

    if (Object.keys(changedProps).length > 0) {
      console.log(`[${componentName}] Changed props:`, changedProps);
    }

    prev.current = propsAndStates;
  });
};
